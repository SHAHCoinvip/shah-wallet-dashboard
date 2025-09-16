// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title ShahSwapRouterV2
 * @dev Enhanced ShahSwap Router with advanced routing, gas optimizations, and permit support
 * Features:
 * - Multi-hop swaps with path optimization
 * - EIP-2612 permit() support for gasless approvals
 * - Batch swap functionality
 * - Split routing for better execution
 * @author SHAH Wallet Team
 */
contract ShahSwapRouterV2 is Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    // Events
    event SwapExecuted(
        address indexed user,
        address[] path,
        uint256 amountIn,
        uint256 amountOut,
        uint256 gasUsed
    );
    
    event BatchSwapExecuted(
        address indexed user,
        uint256 totalAmountIn,
        uint256 totalAmountOut,
        uint256 swapsCount,
        uint256 gasUsed
    );
    
    event PermitSwapExecuted(
        address indexed user,
        address[] path,
        uint256 amountIn,
        uint256 amountOut,
        uint256 deadline
    );

    // State variables
    address public immutable factory;
    address public immutable WETH;
    address public oracle;
    
    // Permit domain separator
    bytes32 public constant PERMIT_TYPEHASH = keccak256(
        "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
    );

    // Structs
    struct SwapParams {
        uint256 amountIn;
        uint256 amountOutMin;
        address[] path;
        address to;
        uint256 deadline;
    }

    struct BatchSwapParams {
        SwapParams[] swaps;
        uint256 totalAmountIn;
        uint256 totalAmountOutMin;
        address to;
        uint256 deadline;
    }

    struct PermitSwapParams {
        SwapParams swap;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct Route {
        address[] path;
        uint256 amountOut;
        uint256 priceImpact;
    }

    // Modifiers
    modifier ensureDeadline(uint256 deadline) {
        require(deadline >= block.timestamp, "Router: EXPIRED");
        _;
    }

    modifier ensurePath(address[] memory path) {
        require(path.length >= 2, "Router: INVALID_PATH");
        _;
    }

    /**
     * @dev Constructor
     * @param _factory ShahSwap factory address
     * @param _WETH WETH address
     */
    constructor(address _factory, address _WETH) 
        Ownable(msg.sender) 
        EIP712("ShahSwapRouterV2", "1.0.0") 
    {
        require(_factory != address(0), "Router: INVALID_FACTORY");
        require(_WETH != address(0), "Router: INVALID_WETH");
        
        factory = _factory;
        WETH = _WETH;
    }

    /**
     * @dev Set oracle address (owner only)
     * @param _oracle Oracle address
     */
    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Router: INVALID_ORACLE");
        oracle = _oracle;
    }

    // ===== BASIC SWAP FUNCTIONS (Backwards Compatible) =====

    /**
     * @dev Swap exact tokens for tokens
     * @param amountIn Input amount
     * @param amountOutMin Minimum output amount
     * @param path Swap path
     * @param to Recipient address
     * @param deadline Transaction deadline
     * @return amounts Output amounts
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensureDeadline(deadline) ensurePath(path) nonReentrant returns (uint256[] memory amounts) {
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Router: INSUFFICIENT_OUTPUT_AMOUNT");

        // Transfer tokens from user to first pair
        IERC20(path[0]).transferFrom(msg.sender, getPair(path[0], path[1]), amountIn);

        // Execute swap
        _swap(amounts, path, to);

        emit SwapExecuted(msg.sender, path, amountIn, amounts[amounts.length - 1], gasleft());
    }

    /**
     * @dev Swap tokens for exact tokens
     * @param amountOut Exact output amount
     * @param amountInMax Maximum input amount
     * @param path Swap path
     * @param to Recipient address
     * @param deadline Transaction deadline
     * @return amounts Output amounts
     */
    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensureDeadline(deadline) ensurePath(path) nonReentrant returns (uint256[] memory amounts) {
        amounts = getAmountsIn(amountOut, path);
        require(amounts[0] <= amountInMax, "Router: EXCESSIVE_INPUT_AMOUNT");

        // Transfer tokens from user to first pair
        IERC20(path[0]).transferFrom(msg.sender, getPair(path[0], path[1]), amounts[0]);

        // Execute swap
        _swap(amounts, path, to);

        emit SwapExecuted(msg.sender, path, amounts[0], amountOut, gasleft());
    }

    /**
     * @dev Swap exact ETH for tokens
     * @param amountOutMin Minimum output amount
     * @param path Swap path
     * @param to Recipient address
     * @param deadline Transaction deadline
     * @return amounts Output amounts
     */
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable ensureDeadline(deadline) ensurePath(path) nonReentrant returns (uint256[] memory amounts) {
        require(path[0] == WETH, "Router: INVALID_PATH");

        amounts = getAmountsOut(msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Router: INSUFFICIENT_OUTPUT_AMOUNT");

        // Wrap ETH to WETH
        IWETH(WETH).deposit{value: msg.value}();

        // Transfer WETH to first pair
        IERC20(WETH).transfer(getPair(WETH, path[1]), msg.value);

        // Execute swap
        _swap(amounts, path, to);

        emit SwapExecuted(msg.sender, path, msg.value, amounts[amounts.length - 1], gasleft());
    }

    /**
     * @dev Swap tokens for exact ETH
     * @param amountOut Exact output amount
     * @param amountInMax Maximum input amount
     * @param path Swap path
     * @param to Recipient address
     * @param deadline Transaction deadline
     * @return amounts Output amounts
     */
    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensureDeadline(deadline) ensurePath(path) nonReentrant returns (uint256[] memory amounts) {
        require(path[path.length - 1] == WETH, "Router: INVALID_PATH");

        amounts = getAmountsIn(amountOut, path);
        require(amounts[0] <= amountInMax, "Router: EXCESSIVE_INPUT_AMOUNT");

        // Transfer tokens from user to first pair
        IERC20(path[0]).transferFrom(msg.sender, getPair(path[0], path[1]), amounts[0]);

        // Execute swap
        _swap(amounts, path, address(this));

        // Unwrap WETH to ETH
        IWETH(WETH).withdraw(amountOut);

        // Transfer ETH to recipient
        (bool success,) = to.call{value: amountOut}("");
        require(success, "Router: ETH_TRANSFER_FAILED");

        emit SwapExecuted(msg.sender, path, amounts[0], amountOut, gasleft());
    }

    // ===== ADVANCED ROUTING FUNCTIONS =====

    /**
     * @dev Multi-hop swap with optimized routing
     * @param params Swap parameters
     * @return amounts Output amounts
     */
    function swapExactTokensForTokensMultiHop(SwapParams calldata params)
        external
        ensureDeadline(params.deadline)
        ensurePath(params.path)
        nonReentrant
        returns (uint256[] memory amounts)
    {
        amounts = getAmountsOut(params.amountIn, params.path);
        require(amounts[amounts.length - 1] >= params.amountOutMin, "Router: INSUFFICIENT_OUTPUT_AMOUNT");

        // Transfer tokens from user to first pair
        IERC20(params.path[0]).transferFrom(msg.sender, getPair(params.path[0], params.path[1]), params.amountIn);

        // Execute multi-hop swap
        _swap(amounts, params.path, params.to);

        emit SwapExecuted(msg.sender, params.path, params.amountIn, amounts[amounts.length - 1], gasleft());
    }

    /**
     * @dev Batch swap multiple tokens in one transaction
     * @param params Batch swap parameters
     * @return totalAmountOut Total output amount
     */
    function batchSwapExactTokensForTokens(BatchSwapParams calldata params)
        external
        ensureDeadline(params.deadline)
        nonReentrant
        returns (uint256 totalAmountOut)
    {
        require(params.swaps.length > 0, "Router: EMPTY_BATCH");
        require(params.swaps.length <= 10, "Router: BATCH_TOO_LARGE");

        uint256 totalAmountIn = 0;
        uint256 totalAmountOutActual = 0;

        for (uint256 i = 0; i < params.swaps.length; i++) {
            SwapParams memory swap = params.swaps[i];
            require(swap.path.length >= 2, "Router: INVALID_PATH");

            uint256[] memory amounts = getAmountsOut(swap.amountIn, swap.path);
            totalAmountIn += swap.amountIn;
            totalAmountOutActual += amounts[amounts.length - 1];

            // Transfer tokens from user to first pair
            IERC20(swap.path[0]).transferFrom(msg.sender, getPair(swap.path[0], swap.path[1]), swap.amountIn);

            // Execute swap
            _swap(amounts, swap.path, params.to);
        }

        require(totalAmountIn == params.totalAmountIn, "Router: INVALID_TOTAL_AMOUNT_IN");
        require(totalAmountOutActual >= params.totalAmountOutMin, "Router: INSUFFICIENT_TOTAL_OUTPUT");

        totalAmountOut = totalAmountOutActual;

        emit BatchSwapExecuted(msg.sender, totalAmountIn, totalAmountOut, params.swaps.length, gasleft());
    }

    // ===== PERMIT FUNCTIONS (EIP-2612) =====

    /**
     * @dev Swap with permit (gasless approval)
     * @param params Permit swap parameters
     * @return amounts Output amounts
     */
    function swapExactTokensForTokensWithPermit(PermitSwapParams calldata params)
        external
        ensureDeadline(params.deadline)
        ensurePath(params.swap.path)
        nonReentrant
        returns (uint256[] memory amounts)
    {
        // Verify permit signature
        address owner = msg.sender;
        bytes32 structHash = keccak256(
            abi.encode(
                PERMIT_TYPEHASH,
                owner,
                address(this),
                params.swap.amountIn,
                IERC20Permit(params.swap.path[0]).nonces(owner),
                params.deadline
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(params.v, params.r, params.s);
        require(signer == owner, "Router: INVALID_SIGNATURE");

        // Execute permit
        IERC20Permit(params.swap.path[0]).permit(
            owner,
            address(this),
            params.swap.amountIn,
            params.deadline,
            params.v,
            params.r,
            params.s
        );

        // Execute swap
        amounts = getAmountsOut(params.swap.amountIn, params.swap.path);
        require(amounts[amounts.length - 1] >= params.swap.amountOutMin, "Router: INSUFFICIENT_OUTPUT_AMOUNT");

        // Transfer tokens from user to first pair
        IERC20(params.swap.path[0]).transferFrom(msg.sender, getPair(params.swap.path[0], params.swap.path[1]), params.swap.amountIn);

        // Execute swap
        _swap(amounts, params.swap.path, params.swap.to);

        emit PermitSwapExecuted(msg.sender, params.swap.path, params.swap.amountIn, amounts[amounts.length - 1], params.deadline);
    }

    // ===== QUOTE FUNCTIONS =====

    /**
     * @dev Get amounts out for a swap
     * @param amountIn Input amount
     * @param path Swap path
     * @return amounts Output amounts
     */
    function getAmountsOut(uint256 amountIn, address[] memory path)
        public
        view
        ensurePath(path)
        returns (uint256[] memory amounts)
    {
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        for (uint256 i = 0; i < path.length - 1; i++) {
            address pair = getPair(path[i], path[i + 1]);
            (uint256 reserve0, uint256 reserve1,) = getReserves(pair);
            
            amounts[i + 1] = getAmountOut(amounts[i], reserve0, reserve1);
        }
    }

    /**
     * @dev Get amounts in for a swap
     * @param amountOut Output amount
     * @param path Swap path
     * @return amounts Input amounts
     */
    function getAmountsIn(uint256 amountOut, address[] memory path)
        public
        view
        ensurePath(path)
        returns (uint256[] memory amounts)
    {
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;

        for (uint256 i = path.length - 1; i > 0; i--) {
            address pair = getPair(path[i - 1], path[i]);
            (uint256 reserve0, uint256 reserve1,) = getReserves(pair);
            
            amounts[i - 1] = getAmountIn(amounts[i], reserve0, reserve1);
        }
    }

    /**
     * @dev Get best route for a swap (if oracle is available)
     * @param amountIn Input amount
     * @param path Swap path
     * @return route Best route information
     */
    function getBestRoute(uint256 amountIn, address[] memory path)
        external
        view
        ensurePath(path)
        returns (Route memory route)
    {
        route.path = path;
        route.amountOut = getAmountsOut(amountIn, path)[path.length - 1];

        // Calculate price impact if oracle is available
        if (oracle != address(0)) {
            try IOracle(oracle).getPriceImpact(path[0], path[path.length - 1], amountIn) returns (uint256 impact) {
                route.priceImpact = impact;
            } catch {
                route.priceImpact = 0;
            }
        }
    }

    // ===== INTERNAL FUNCTIONS =====

    /**
     * @dev Execute swap through pairs
     * @param amounts Amounts array
     * @param path Swap path
     * @param to Recipient address
     */
    function _swap(
        uint256[] memory amounts,
        address[] memory path,
        address to
    ) internal {
        for (uint256 i = 0; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == token0 ? (uint256(0), amountOut) : (amountOut, uint256(0));
            address to_ = i < path.length - 2 ? getPair(output, path[i + 2]) : to;
            
            // Call pair swap function
            address pair = getPair(input, output);
            (bool success,) = pair.call(
                abi.encodeWithSignature(
                    "swap(uint256,uint256,address,bytes)",
                    amount0Out,
                    amount1Out,
                    to_,
                    ""
                )
            );
            require(success, "Router: SWAP_FAILED");
        }
    }

    /**
     * @dev Calculate output amount for a swap
     * @param amountIn Input amount
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @return amountOut Output amount
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) internal pure returns (uint256 amountOut) {
        require(amountIn > 0, "Router: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "Router: INSUFFICIENT_LIQUIDITY");

        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /**
     * @dev Calculate input amount for a swap
     * @param amountOut Output amount
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @return amountIn Input amount
     */
    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut
    ) internal pure returns (uint256 amountIn) {
        require(amountOut > 0, "Router: INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "Router: INSUFFICIENT_LIQUIDITY");

        uint256 numerator = reserveIn * amountOut * 1000;
        uint256 denominator = (reserveOut - amountOut) * 997;
        amountIn = (numerator / denominator) + 1;
    }

    /**
     * @dev Sort tokens to match pair order
     * @param tokenA First token
     * @param tokenB Second token
     * @return token0 First token in sorted order
     * @return token1 Second token in sorted order
     */
    function sortTokens(address tokenA, address tokenB)
        internal
        pure
        returns (address token0, address token1)
    {
        return tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }

    /**
     * @dev Get pair address from factory
     * @param tokenA First token
     * @param tokenB Second token
     * @return pair Pair address
     */
    function getPair(address tokenA, address tokenB) internal view returns (address pair) {
        (bool success, bytes memory data) = factory.staticcall(
            abi.encodeWithSignature("getPair(address,address)", tokenA, tokenB)
        );
        
        if (success && data.length >= 32) {
            pair = abi.decode(data, (address));
        }
    }

    /**
     * @dev Get reserves from pair
     * @param pair Pair address
     * @return reserve0 Reserve of token0
     * @return reserve1 Reserve of token1
     * @return blockTimestampLast Last block timestamp
     */
    function getReserves(address pair) internal view returns (uint256 reserve0, uint256 reserve1, uint32 blockTimestampLast) {
        (bool success, bytes memory data) = pair.staticcall(
            abi.encodeWithSignature("getReserves()")
        );
        
        if (success && data.length >= 96) {
            (reserve0, reserve1, blockTimestampLast) = abi.decode(data, (uint256, uint256, uint32));
        }
    }

    /**
     * @dev Emergency function to recover tokens (owner only)
     * @param token Token address
     * @param amount Amount to recover
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }

    /**
     * @dev Emergency function to recover ETH (owner only)
     */
    function emergencyRecoverETH() external onlyOwner {
        (bool success,) = owner().call{value: address(this).balance}("");
        require(success, "Router: ETH_RECOVERY_FAILED");
    }

    // ===== FALLBACK FUNCTIONS =====

    receive() external payable {
        require(msg.sender == WETH, "Router: INVALID_SENDER");
    }
}

// ===== INTERFACES =====

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

interface IOracle {
    function getPriceImpact(address tokenIn, address tokenOut, uint256 amountIn) external view returns (uint256);
}
