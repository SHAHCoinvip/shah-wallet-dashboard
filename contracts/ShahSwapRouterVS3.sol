// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./ShahSwapFactory.sol";
import "./interfaces/IShahSwapPair.sol";

// Inline interfaces
interface IERC20Extended {
    function totalSupply() external view returns (uint);
    function balanceOf(address owner) external view returns (uint);
    function transfer(address to, uint value) external returns (bool);
    function approve(address spender, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);
    function decimals() external view returns (uint8);
}

interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint value) external returns (bool);
    function withdraw(uint) external;
}


interface IOracle {
    function getPriceImpact(address tokenIn, address tokenOut, uint256 amountIn) external view returns (uint256);
}

library ShahSwapLibrary {
    // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, 'ShahSwapLibrary: IDENTICAL_ADDRESSES');
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'ShahSwapLibrary: ZERO_ADDRESS');
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(address factory, address tokenA, address tokenB) internal pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(uint160(uint256(keccak256(abi.encodePacked(
                hex'ff',
                factory,
                keccak256(abi.encodePacked(token0, token1)),
                hex'96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f' // init code hash
            )))));
    }

    // fetches and sorts the reserves for a pair
    function getReserves(address factory, address tokenA, address tokenB) internal view returns (uint reserveA, uint reserveB) {
        (address token0,) = sortTokens(tokenA, tokenB);
        (uint reserve0, uint reserve1,) = IShahSwapPair(pairFor(factory, tokenA, tokenB)).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    // given some amount of an asset and pair reserves, returns an equivalent amount of the other asset
    function quote(uint amountA, uint reserveA, uint reserveB) internal pure returns (uint amountB) {
        require(amountA > 0, 'ShahSwapLibrary: INSUFFICIENT_AMOUNT');
        require(reserveA > 0 && reserveB > 0, 'ShahSwapLibrary: INSUFFICIENT_LIQUIDITY');
        amountB = amountA * reserveB / reserveA;
    }

    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
        require(amountIn > 0, 'ShahSwapLibrary: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'ShahSwapLibrary: INSUFFICIENT_LIQUIDITY');
        uint amountInWithFee = amountIn * 997;
        uint numerator = amountInWithFee * reserveOut;
        uint denominator = reserveIn * 1000 + amountInWithFee;
        amountOut = numerator / denominator;
    }

    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) internal pure returns (uint amountIn) {
        require(amountOut > 0, 'ShahSwapLibrary: INSUFFICIENT_OUTPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'ShahSwapLibrary: INSUFFICIENT_LIQUIDITY');
        uint numerator = reserveIn * amountOut * 1000;
        uint denominator = (reserveOut - amountOut) * 997;
        amountIn = (numerator / denominator) + 1;
    }

    // performs chained getAmountOut calculations on any number of pairs
    function getAmountsOut(address factory, uint amountIn, address[] memory path) internal view returns (uint[] memory amounts) {
        require(path.length >= 2, 'ShahSwapLibrary: INVALID_PATH');
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        for (uint i; i < path.length - 1; i++) {
            (uint reserveIn, uint reserveOut) = getReserves(factory, path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    // performs chained getAmountIn calculations on any number of pairs
    function getAmountsIn(address factory, uint amountOut, address[] memory path) internal view returns (uint[] memory amounts) {
        require(path.length >= 2, 'ShahSwapLibrary: INVALID_PATH');
        amounts = new uint[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint i = path.length - 1; i > 0; i--) {
            (uint reserveIn, uint reserveOut) = getReserves(factory, path[i - 1], path[i]);
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }
}

// helper methods for interacting with ERC20 tokens and sending ETH that do not consistently return true/false
library TransferHelper {
    function safeApprove(address token, address to, uint value) internal {
        // bytes4(keccak256(bytes('approve(address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x095ea7b3, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: APPROVE_FAILED');
    }

    function safeTransfer(address token, address to, uint value) internal {
        // bytes4(keccak256(bytes('transfer(address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FAILED');
    }

    function safeTransferFrom(address token, address from, address to, uint value) internal {
        // bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FROM_FAILED');
    }

    function safeTransferETH(address to, uint value) internal {
        (bool success,) = to.call{value:value}(new bytes(0));
        require(success, 'TransferHelper: ETH_TRANSFER_FAILED');
    }
}

/**
 * @title ShahSwapRouterVS3
 * @dev Unified ShahSwap Router combining liquidity management and advanced swap features
 * Features:
 * - Liquidity management (add/remove)
 * - Advanced swaps (batch, multi-hop, permit)
 * - Oracle integration for pricing
 * @author SHAH Wallet Team
 */
contract ShahSwapRouterVS3 is Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    // Events
    event LiquidityAdded(
        address indexed user,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    
    event LiquidityRemoved(
        address indexed user,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    
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
     * @param _oracle Oracle address
     */
    constructor(address _factory, address _WETH, address _oracle) 
        Ownable(msg.sender) 
        EIP712("ShahSwapRouterVS3", "1.0.0") 
    {
        require(_factory != address(0), "Router: INVALID_FACTORY");
        require(_WETH != address(0), "Router: INVALID_WETH");
        
        factory = _factory;
        WETH = _WETH;
        oracle = _oracle;
    }

    /**
     * @dev Set oracle address (owner only)
     * @param _oracle Oracle address
     */
    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Router: INVALID_ORACLE");
        oracle = _oracle;
    }

    receive() external payable {
        assert(msg.sender == WETH); // only accept ETH via fallback from the WETH contract
    }

    // ===== LIQUIDITY FUNCTIONS =====

    /**
     * @dev Add liquidity to a pair
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param amountADesired Desired amount of tokenA
     * @param amountBDesired Desired amount of tokenB
     * @param amountAMin Minimum amount of tokenA
     * @param amountBMin Minimum amount of tokenB
     * @param to Recipient address
     * @param deadline Transaction deadline
     * @return amountA Actual amount of tokenA added
     * @return amountB Actual amount of tokenB added
     * @return liquidity Amount of LP tokens minted
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external virtual ensureDeadline(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = ShahSwapLibrary.pairFor(factory, tokenA, tokenB);
        IERC20Extended(tokenA).transferFrom(msg.sender, pair, amountA);
        IERC20Extended(tokenB).transferFrom(msg.sender, pair, amountB);
        liquidity = IShahSwapPair(pair).mint(to);
        
        emit LiquidityAdded(msg.sender, tokenA, tokenB, amountA, amountB, liquidity);
    }

    /**
     * @dev Add liquidity with ETH
     * @param token Token address
     * @param amountTokenDesired Desired amount of token
     * @param amountTokenMin Minimum amount of token
     * @param amountETHMin Minimum amount of ETH
     * @param to Recipient address
     * @param deadline Transaction deadline
     * @return amountToken Actual amount of token added
     * @return amountETH Actual amount of ETH added
     * @return liquidity Amount of LP tokens minted
     */
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external virtual payable ensureDeadline(deadline) returns (uint amountToken, uint amountETH, uint liquidity) {
        (amountToken, amountETH) = _addLiquidity(
            token,
            WETH,
            amountTokenDesired,
            msg.value,
            amountTokenMin,
            amountETHMin
        );
        address pair = ShahSwapLibrary.pairFor(factory, token, WETH);
        IERC20Extended(token).transferFrom(msg.sender, pair, amountToken);
        IWETH(WETH).deposit{value: amountETH}();
        assert(IWETH(WETH).transfer(pair, amountETH));
        liquidity = IShahSwapPair(pair).mint(to);
        
        // refund dust eth, if any
        if (msg.value > amountETH) TransferHelper.safeTransferETH(msg.sender, msg.value - amountETH);
        
        emit LiquidityAdded(msg.sender, token, WETH, amountToken, amountETH, liquidity);
    }

    /**
     * @dev Remove liquidity from a pair
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param liquidity Amount of LP tokens to burn
     * @param amountAMin Minimum amount of tokenA to receive
     * @param amountBMin Minimum amount of tokenB to receive
     * @param to Recipient address
     * @param deadline Transaction deadline
     * @return amountA Amount of tokenA received
     * @return amountB Amount of tokenB received
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) public virtual ensureDeadline(deadline) returns (uint amountA, uint amountB) {
        address pair = ShahSwapLibrary.pairFor(factory, tokenA, tokenB);
        IERC20Extended(pair).transferFrom(msg.sender, pair, liquidity); // send liquidity to pair
        (uint amount0, uint amount1) = IShahSwapPair(pair).burn(to);
        (address token0,) = ShahSwapLibrary.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, 'ShahSwapRouter: INSUFFICIENT_A_AMOUNT');
        require(amountB >= amountBMin, 'ShahSwapRouter: INSUFFICIENT_B_AMOUNT');
        
        emit LiquidityRemoved(msg.sender, tokenA, tokenB, amountA, amountB, liquidity);
    }

    /**
     * @dev Remove liquidity with ETH
     * @param token Token address
     * @param liquidity Amount of LP tokens to burn
     * @param amountTokenMin Minimum amount of token to receive
     * @param amountETHMin Minimum amount of ETH to receive
     * @param to Recipient address
     * @param deadline Transaction deadline
     * @return amountToken Amount of token received
     * @return amountETH Amount of ETH received
     */
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) public virtual ensureDeadline(deadline) returns (uint amountToken, uint amountETH) {
        (amountToken, amountETH) = removeLiquidity(
            token,
            WETH,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        IERC20Extended(token).transfer(to, amountToken);
        IWETH(WETH).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
        
        emit LiquidityRemoved(msg.sender, token, WETH, amountToken, amountETH, liquidity);
    }

    /**
     * @dev Remove liquidity with ETH supporting fee on transfer tokens
     * @param token Token address
     * @param liquidity Amount of LP tokens to burn
     * @param amountTokenMin Minimum amount of token to receive
     * @param amountETHMin Minimum amount of ETH to receive
     * @param to Recipient address
     * @param deadline Transaction deadline
     * @return amountETH Amount of ETH received
     */
    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) public virtual ensureDeadline(deadline) returns (uint amountETH) {
        (, uint amountETH) = removeLiquidity(
            token,
            WETH,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(token, to, IERC20Extended(token).balanceOf(address(this)));
        IWETH(WETH).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
        
        emit LiquidityRemoved(msg.sender, token, WETH, IERC20Extended(token).balanceOf(address(this)), amountETH, liquidity);
    }

    // ===== BASIC SWAP FUNCTIONS =====

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
        IERC20Extended(path[0]).transferFrom(msg.sender, ShahSwapLibrary.pairFor(factory, path[0], path[1]), amountIn);

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
        IERC20Extended(path[0]).transferFrom(msg.sender, ShahSwapLibrary.pairFor(factory, path[0], path[1]), amounts[0]);

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
        IERC20Extended(WETH).transfer(ShahSwapLibrary.pairFor(factory, WETH, path[1]), msg.value);

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
        IERC20Extended(path[0]).transferFrom(msg.sender, ShahSwapLibrary.pairFor(factory, path[0], path[1]), amounts[0]);

        // Execute swap
        _swap(amounts, path, address(this));

        // Unwrap WETH to ETH
        IWETH(WETH).withdraw(amountOut);

        // Transfer ETH to recipient
        TransferHelper.safeTransferETH(to, amountOut);

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
        IERC20Extended(params.path[0]).transferFrom(msg.sender, ShahSwapLibrary.pairFor(factory, params.path[0], params.path[1]), params.amountIn);

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
            IERC20Extended(swap.path[0]).transferFrom(msg.sender, ShahSwapLibrary.pairFor(factory, swap.path[0], swap.path[1]), swap.amountIn);

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
        IERC20Extended(params.swap.path[0]).transferFrom(msg.sender, ShahSwapLibrary.pairFor(factory, params.swap.path[0], params.swap.path[1]), params.swap.amountIn);

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
        return ShahSwapLibrary.getAmountsOut(factory, amountIn, path);
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
        return ShahSwapLibrary.getAmountsIn(factory, amountOut, path);
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

    /**
     * @dev Quote function
     * @param amountA Amount of tokenA
     * @param reserveA Reserve of tokenA
     * @param reserveB Reserve of tokenB
     * @return amountB Equivalent amount of tokenB
     */
    function quote(uint amountA, uint reserveA, uint reserveB) public pure virtual returns (uint amountB) {
        return ShahSwapLibrary.quote(amountA, reserveA, reserveB);
    }

    /**
     * @dev Get amount out
     * @param amountIn Input amount
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @return amountOut Output amount
     */
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut)
        public
        pure
        virtual
        returns (uint amountOut)
    {
        return ShahSwapLibrary.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    /**
     * @dev Get amount in
     * @param amountOut Output amount
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @return amountIn Input amount
     */
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut)
        public
        pure
        virtual
        returns (uint amountIn)
    {
        return ShahSwapLibrary.getAmountIn(amountOut, reserveIn, reserveOut);
    }

    // ===== INTERNAL FUNCTIONS =====

    /**
     * @dev Internal function to add liquidity
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param amountADesired Desired amount of tokenA
     * @param amountBDesired Desired amount of tokenB
     * @param amountAMin Minimum amount of tokenA
     * @param amountBMin Minimum amount of tokenB
     * @return amountA Actual amount of tokenA
     * @return amountB Actual amount of tokenB
     */
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) internal virtual returns (uint amountA, uint amountB) {
        // create the pair if it doesn't exist yet
        if (ShahSwapFactory(factory).getPair(tokenA, tokenB) == address(0)) {
            ShahSwapFactory(factory).createPair(tokenA, tokenB);
        }
        (uint reserveA, uint reserveB) = ShahSwapLibrary.getReserves(factory, tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint amountBOptimal = ShahSwapLibrary.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, 'ShahSwapRouter: INSUFFICIENT_B_AMOUNT');
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = ShahSwapLibrary.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, 'ShahSwapRouter: INSUFFICIENT_A_AMOUNT');
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

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
            (address token0,) = ShahSwapLibrary.sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == token0 ? (uint256(0), amountOut) : (amountOut, uint256(0));
            address to_ = i < path.length - 2 ? ShahSwapLibrary.pairFor(factory, output, path[i + 2]) : to;
            
            // Call pair swap function
            address pair = ShahSwapLibrary.pairFor(factory, input, output);
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
     * @dev Emergency function to recover tokens (owner only)
     * @param token Token address
     * @param amount Amount to recover
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        IERC20Extended(token).transfer(owner(), amount);
    }

    /**
     * @dev Emergency function to recover ETH (owner only)
     */
    function emergencyRecoverETH() external onlyOwner {
        TransferHelper.safeTransferETH(owner(), address(this).balance);
    }
}
