appId = 
serverUrl =
Moralis.start({ serverUrl, appId });

async function init() {
  await Moralis.initPlugins();
  await Moralis.enableWeb3();
  await listAvailableToken();
  currentUser = Moralis.User.current();
  if (currentUser) {
    document.getElementById("swap_button").disabled = false;
   
}

let currentTrade = {};
let currentSelectedSide;
let tokens;
async function listAvailableToken() {
  const results = await Moralis.Plugins.oneInch.getSupportedTokens({
    chain: "eth",
  });
  tokens = results.tokens;
  let parent = document.getElementById("token_list");
  for (const address in tokens) {
    if (address !== null) {
      let token = tokens[address];
      let div = document.createElement("div");
      div.setAttribute("data-address", address);
      div.className = "token_row";
      let html = `
            <img class="token_list_img" src="${token.logoURI}">
            <span class="token_list_text">${token.symbol}</span>`;
      div.innerHTML = html;
      div.onclick = () => {
        selectToken(address);
      };
      parent.appendChild(div);
    }
  }
}
async function selectToken(address) {
  close();
  //let address = event.target.getAttribute("data-address");
  console.log(address);
  currentTrade[currentSelectedSide] = tokens[address];
  console.log(currentTrade);
  renderInterface();
}
function renderInterface() {
  if (currentTrade.from) {
    document.getElementById("from_token_img").src = currentTrade.from.logoURI;
    document.getElementById("from_token_text").innerHTML =
      currentTrade.from.symbol;
  }
  if (currentTrade.to) {
    document.getElementById("to_token_img").src = currentTrade.to.logoURI;
    document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
  }
}

async function login() {
  try {
    document.getElementById("swap_button").disabled = false;
    
  } catch (error) {
    console.log(error);
  }
}
function openModal(side) {
  currentSelectedSide = side;
  document.getElementById("token_modal").style.display = "block";
}
function close() {
  document.getElementById("token_modal").style.display = "";
}
async function getQuote() {
  if (
    !currentTrade.from ||
    !currentTrade.to ||
    !document.getElementById("from_amount").value
  )
    return;
  let amount = Number(
    document.getElementById("from_amount").value *
      10 ** currentTrade.from.decimals
  );
  const quote = await Moralis.Plugins.oneInch.quote({
    chain: "eth",
    // The blockchain you want to use (eth/bsc/polygon)
    fromTokenAddress: currentTrade.from.address,
    // The token you want to swap
    toTokenAddress: currentTrade.to.address,
    // The token you want to receive
    amount: amount,
  });
  console.log(quote);
  document.getElementById("gas_estimate").innerHTML = quote.estimatedGas;
  document.getElementById("to_amount").value =
    quote.toTokenAmount / 10 ** quote.toToken.decimals;
}
async function trySwap() {
  let address = Moralis.User.current().get("ethAddress");
  let amount = Number(
    document.getElementById("from_amount").value *
      10 ** currentTrade.from.decimals
  );
  if (currentTrade.from.symbol !== "ETH") {
   
    const allowance = await Moralis.Plugins.oneInch.hasAllowance({
      chain: "eth",
      fromTokenAddress: currentTrade.from.address,
      fromAddress: address,
      amount: amount,
    });
    console.log(allowance);
    if (allowance >= amount) {
      if (!allowance) {
        await Moralis.Plugins.oneInch.approve({
          chain: "eth",
          tokenAddress: currentTrade.from.address,
          fromAddress: address,
        });
      }
    }
   
  }
  let receipt = await doSwap(address, amount);
  alert("Swap Complete");
  
}
function doSwap(userAddress, amount) {
  return Moralis.Plugins.oneInch.swap({
    chain: "bsc",
    fromTokenAddress:  currentTrade.from.address,
    toTokenAddress: currentTrade.to.address,
    amount: amount,
    fromAddress: userAddress,
    
    slippage: 1,
  });
  
}

init();
document.getElementById("login_button").onclick = login;
document.getElementById("from_token_selected").onclick = () => {
  openModal("from");
};
document.getElementById("to_token_selected").onclick = () => {
  openModal("to");
};
document.getElementById("close_btn").onclick = close;
document.getElementById("from_amount").onblur = getQuote;
document.getElementById("swap_button").onclick = trySwap;
