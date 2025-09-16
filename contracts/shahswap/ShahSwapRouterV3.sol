// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IShahSwapFactoryV3.sol";
import "./interfaces/IShahSwapPair.sol";
import "./interfaces/IWETH.sol";
import "./interfaces/IERC20Permit.sol";
import "./libs/TransferHelper.sol";

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract ShahSwapRouterV3 is Ownable, ReentrancyGuard {
    using TransferHelper for address;

    address public immutable factory;
    address public immutable WETH;
    address public oracle;

    struct BatchStep {
        address[] path;
        uint256 amountIn;
        uint256 amountOutMin;
    }

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, 'ShahSwapRouter: EXPIRED');
        _;
    }

    event LiquidityAdded(address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 liquidity);
    event SwapExecuted(address[] path, uint256 amountIn, uint256 amountOut);

    constructor(address _factory, address _WETH, address _oracle) Ownable(msg.sender) {
        factory = _factory;
        WETH = _WETH;
        oracle = _oracle;
    }

    receive() external payable {
        assert(msg.sender == WETH); // only accept ETH via fallback from the WETH contract
    }

    // **** ADD LIQUIDITY ****
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal virtual returns (uint256 amountA, uint256 amountB) {
        // create the pair if it doesn't exist yet
        if (IShahSwapFactoryV3(factory).getPair(tokenA, tokenB) == address(0)) {
            IShahSwapFactoryV3(factory).createPair(tokenA, tokenB);
        }
        (uint256 reserveA, uint256 reserveB) = getReserves(factory, tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, 'ShahSwapRouter: INSUFFICIENT_B_AMOUNT');
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, 'ShahSwapRouter: INSUFFICIENT_A_AMOUNT');
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external virtual ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = pairFor(factory, tokenA, tokenB);
        tokenA.safeTransferFrom(msg.sender, pair, amountA);
        tokenB.safeTransferFrom(msg.sender, pair, amountB);
        liquidity = IShahSwapPair(pair).mint(to);
        emit LiquidityAdded(tokenA, tokenB, amountA, amountB, liquidity);
    }

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external virtual payable ensure(deadline) returns (uint256 amountToken, uint256 amountETH, uint256 liquidity) {
        (amountToken, amountETH) = _addLiquidity(
            token,
            WETH,
            amountTokenDesired,
            msg.value,
            amountTokenMin,
            amountETHMin
        );
        address pair = pairFor(factory, token, WETH);
        token.safeTransferFrom(msg.sender, pair, amountToken);
        IWETH(WETH).deposit{value: amountETH}();
        assert(IWETH(WETH).transfer(pair, amountETH));
        liquidity = IShahSwapPair(pair).mint(to);
        // refund dust eth, if any
        if (msg.value > amountETH) TransferHelper.safeTransferETH(msg.sender, msg.value - amountETH);
        emit LiquidityAdded(token, WETH, amountToken, amountETH, liquidity);
    }

    // **** REMOVE LIQUIDITY ****
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) public virtual ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        address pair = pairFor(factory, tokenA, tokenB);
        IShahSwapPair(pair).transferFrom(msg.sender, pair, liquidity); // send liquidity to pair
        (uint256 amount0, uint256 amount1) = IShahSwapPair(pair).burn(to);
        (address token0,) = sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, 'ShahSwapRouter: INSUFFICIENT_A_AMOUNT');
        require(amountB >= amountBMin, 'ShahSwapRouter: INSUFFICIENT_B_AMOUNT');
        emit LiquidityRemoved(tokenA, tokenB, amountA, amountB, liquidity);
    }

    function removeLiquidityETH(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) public virtual ensure(deadline) returns (uint256 amountToken, uint256 amountETH) {
        (amountToken, amountETH) = removeLiquidity(
            token,
            WETH,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        token.safeTransfer(to, amountToken);
        IWETH(WETH).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
    }

    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) public virtual ensure(deadline) returns (uint256 amountETH) {
        (, uint256 amountETHOut) = removeLiquidity(
            token,
            WETH,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        token.safeTransfer(to, IERC20(token).balanceOf(address(this)));
        IWETH(WETH).withdraw(amountETHOut);
        TransferHelper.safeTransferETH(to, amountETHOut);
        return amountETHOut;
    }

    // **** SWAP ****
    // requires the initial amount to have already been sent to the first pair
    function _swap(uint256[] memory amounts, address[] memory path, address _to) internal virtual {
        for (uint256 i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == token0 ? (uint256(0), amountOut) : (amountOut, uint256(0));
            address to = i < path.length - 2 ? pairFor(factory, output, path[i + 2]) : _to;
            IShahSwapPair(pairFor(factory, input, output)).swap(
                amount0Out, amount1Out, to, new bytes(0)
            );
        }
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external virtual ensure(deadline) returns (uint256[] memory amounts) {
        amounts = getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'ShahSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT');
        path[0].safeTransferFrom(msg.sender, pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
        emit SwapExecuted(path, amountIn, amounts[amounts.length - 1]);
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external virtual ensure(deadline) returns (uint256[] memory amounts) {
        amounts = getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, 'ShahSwapRouter: EXCESSIVE_INPUT_AMOUNT');
        path[0].safeTransferFrom(msg.sender, pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
        emit SwapExecuted(path, amounts[0], amountOut);
    }

    function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline)
        external
        virtual
        payable
        ensure(deadline)
        returns (uint256[] memory amounts)
    {
        require(path[0] == WETH, 'ShahSwapRouter: INVALID_PATH');
        amounts = getAmountsOut(factory, msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'ShahSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT');
        IWETH(WETH).deposit{value: amounts[0]}();
        assert(IWETH(WETH).transfer(pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
        emit SwapExecuted(path, msg.value, amounts[amounts.length - 1]);
    }

    function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] calldata path, address to, uint256 deadline)
        external
        virtual
        ensure(deadline)
        returns (uint256[] memory amounts)
    {
        require(path[path.length - 1] == WETH, 'ShahSwapRouter: INVALID_PATH');
        amounts = getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, 'ShahSwapRouter: EXCESSIVE_INPUT_AMOUNT');
        path[0].safeTransferFrom(msg.sender, pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
        emit SwapExecuted(path, amounts[0], amountOut);
    }

    function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline)
        external
        virtual
        ensure(deadline)
        returns (uint256[] memory amounts)
    {
        require(path[path.length - 1] == WETH, 'ShahSwapRouter: INVALID_PATH');
        amounts = getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'ShahSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT');
        path[0].safeTransferFrom(msg.sender, pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
        emit SwapExecuted(path, amountIn, amounts[amounts.length - 1]);
    }

    function swapETHForExactTokens(uint256 amountOut, address[] calldata path, address to, uint256 deadline)
        external
        virtual
        payable
        ensure(deadline)
        returns (uint256[] memory amounts)
    {
        require(path[0] == WETH, 'ShahSwapRouter: INVALID_PATH');
        amounts = getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= msg.value, 'ShahSwapRouter: EXCESSIVE_INPUT_AMOUNT');
        IWETH(WETH).deposit{value: amounts[0]}();
        assert(IWETH(WETH).transfer(pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
        // refund dust eth, if any
        if (msg.value > amounts[0]) TransferHelper.safeTransferETH(msg.sender, msg.value - amounts[0]);
        emit SwapExecuted(path, amounts[0], amountOut);
    }

    // **** ADVANCED SWAPS ****
    function batchSwapExactTokensForTokens(
        BatchStep[] calldata steps,
        address to,
        uint256 deadline
    ) external virtual ensure(deadline) nonReentrant {
        for (uint256 i = 0; i < steps.length; i++) {
            BatchStep calldata step = steps[i];
            uint256[] memory amounts = getAmountsOut(factory, step.amountIn, step.path);
            require(amounts[amounts.length - 1] >= step.amountOutMin, 'ShahSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT');
            step.path[0].safeTransferFrom(msg.sender, pairFor(factory, step.path[0], step.path[1]), amounts[0]);
            _swap(amounts, step.path, to);
            emit SwapExecuted(step.path, step.amountIn, amounts[amounts.length - 1]);
        }
    }

    function swapExactTokensForTokensMultiHop(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external virtual ensure(deadline) returns (uint256[] memory amounts) {
        amounts = getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'ShahSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT');
        path[0].safeTransferFrom(msg.sender, pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
        emit SwapExecuted(path, amountIn, amounts[amounts.length - 1]);
    }

    function swapExactTokensForTokensWithPermit(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external virtual ensure(deadline) returns (uint256[] memory amounts) {
        IERC20Permit(path[0]).permit(msg.sender, address(this), amountIn, deadline, v, r, s);
        amounts = getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'ShahSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT');
        path[0].safeTransferFrom(msg.sender, pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
        emit SwapExecuted(path, amountIn, amounts[amounts.length - 1]);
    }

    // **** LIBRARY FUNCTIONS ****
    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) public pure virtual returns (uint256 amountB) {
        require(amountA > 0, 'ShahSwapRouter: INSUFFICIENT_AMOUNT');
        require(reserveA > 0 && reserveB > 0, 'ShahSwapRouter: INSUFFICIENT_LIQUIDITY');
        amountB = amountA * reserveB / reserveA;
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        public
        pure
        virtual
        returns (uint256 amountOut)
    {
        require(amountIn > 0, 'ShahSwapRouter: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'ShahSwapRouter: INSUFFICIENT_LIQUIDITY');
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut)
        public
        pure
        virtual
        returns (uint256 amountIn)
    {
        require(amountOut > 0, 'ShahSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'ShahSwapRouter: INSUFFICIENT_LIQUIDITY');
        uint256 numerator = reserveIn * amountOut * 1000;
        uint256 denominator = (reserveOut - amountOut) * 997;
        amountIn = (numerator / denominator) + 1;
    }

    function getAmountsOut(uint256 amountIn, address[] memory path)
        public
        view
        virtual
        returns (uint256[] memory amounts)
    {
        return getAmountsOut(factory, amountIn, path);
    }

    function getAmountsIn(uint256 amountOut, address[] memory path)
        public
        view
        virtual
        returns (uint256[] memory amounts)
    {
        return getAmountsIn(factory, amountOut, path);
    }

    // **** ORACLE INTEGRATION ****
    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }

    function getBestRoute(address tokenIn, address tokenOut, uint256 amountIn) external view returns (address[] memory bestPath) {
        // Simple heuristic: try direct path first, then through WETH
        address[] memory directPath = new address[](2);
        directPath[0] = tokenIn;
        directPath[1] = tokenOut;
        
        if (IShahSwapFactoryV3(factory).getPair(tokenIn, tokenOut) != address(0)) {
            return directPath;
        }
        
        // Try through WETH
        address[] memory wethPath = new address[](3);
        wethPath[0] = tokenIn;
        wethPath[1] = WETH;
        wethPath[2] = tokenOut;
        
        if (IShahSwapFactoryV3(factory).getPair(tokenIn, WETH) != address(0) && 
            IShahSwapFactoryV3(factory).getPair(WETH, tokenOut) != address(0)) {
            return wethPath;
        }
        
        revert('ShahSwapRouter: NO_ROUTE');
    }

    // **** INTERNAL FUNCTIONS ****
    function getReserves(address _factory, address tokenA, address tokenB) internal view returns (uint256 reserveA, uint256 reserveB) {
        (address token0,) = sortTokens(tokenA, tokenB);
        (uint256 reserve0, uint256 reserve1,) = IShahSwapPair(pairFor(_factory, tokenA, tokenB)).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, 'ShahSwapRouter: IDENTICAL_ADDRESSES');
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'ShahSwapRouter: ZERO_ADDRESS');
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(address _factory, address tokenA, address tokenB) internal pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(uint160(uint256(keccak256(abi.encodePacked(
                hex'ff',
                _factory,
                keccak256(abi.encodePacked(token0, token1)),
                hex'5d59ee5b4a031065f4eea90c908632a8d5368f79ae9915560d3359be24de471c' // INIT_CODE_PAIR_HASH
            )))));
    }

    function getAmountsOut(address _factory, uint256 amountIn, address[] memory path)
        internal
        view
        returns (uint256[] memory amounts)
    {
        require(path.length >= 2, 'ShahSwapRouter: INVALID_PATH');
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i; i < path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(_factory, path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    function getAmountsIn(address _factory, uint256 amountOut, address[] memory path)
        internal
        view
        returns (uint256[] memory amounts)
    {
        require(path.length >= 2, 'ShahSwapRouter: INVALID_PATH');
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint256 i = path.length - 1; i > 0; i--) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(_factory, path[i - 1], path[i]);
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }
}