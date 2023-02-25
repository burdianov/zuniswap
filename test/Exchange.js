const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("Exchange", function () {
  async function deployTokenAndExchangeFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy("Sample Token", "STKN", toWei(1_000_000));

    const Exchange = await ethers.getContractFactory("Exchange");
    const exchange = await Exchange.deploy(token.address);

    return { token, exchange, owner, otherAccount };
  }

  const toWei = (value) => ethers.utils.parseEther(value.toString());

  const fromWei = (value) =>
    ethers.utils.formatEther(
      typeof value === "string" ? value : value.toString()
    );

  function getBalance(address) {
    return ethers.provider.getBalance(address);
  }

  describe("addLiquidity", function () {
    it("Should add liquidity", async function () {
      const { token, exchange, owner } = await loadFixture(
        deployTokenAndExchangeFixture
      );

      await token.approve(exchange.address, toWei(200));
      await exchange.addLiquidity(toWei(200), {
        value: toWei(100),
      });

      expect(await getBalance(exchange.address)).to.equal(toWei(100));
      expect(await exchange.getReserve()).to.equal(toWei(200));
    });
  });

  describe("getPrice", async () => {
    it("should return correct prices", async () => {
      const { token, exchange } = await loadFixture(
        deployTokenAndExchangeFixture
      );

      await token.approve(exchange.address, toWei(2_000));
      await exchange.addLiquidity(toWei(2_000), { value: toWei(1000) });

      const tokenReserve = await exchange.getReserve();
      const etherReserve = await getBalance(exchange.address);

      // ETH per token
      expect(
        (await exchange.getPrice(etherReserve, tokenReserve)).toString()
      ).to.eq("500");

      // token per ETH
      expect(
        (await exchange.getPrice(tokenReserve, etherReserve)).toString()
      ).to.eq("2000");
    });
  });

  describe("getTokenAmount", async () => {
    it("returns correct token amount", async () => {
      const { token, exchange } = await loadFixture(
        deployTokenAndExchangeFixture
      );

      await token.approve(exchange.address, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });

      let tokensOut = await exchange.getTokenAmount(toWei(1));
      expect(fromWei(tokensOut)).to.equal("1.978041738678708079");

      tokensOut = await exchange.getTokenAmount(toWei(100));
      expect(fromWei(tokensOut)).to.equal("180.1637852593266606");

      tokensOut = await exchange.getTokenAmount(toWei(1000));
      expect(fromWei(tokensOut)).to.equal("994.974874371859296482");
    });
  });

  describe("getEthAmount", async () => {
    it("returns correct eth amount", async () => {
      const { token, exchange } = await loadFixture(
        deployTokenAndExchangeFixture
      );

      await token.approve(exchange.address, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });

      let ethOut = await exchange.getEthAmount(toWei(2));
      expect(fromWei(ethOut)).to.equal("0.989020869339354039");

      ethOut = await exchange.getEthAmount(toWei(100));
      expect(fromWei(ethOut)).to.equal("47.16531681753215817");

      ethOut = await exchange.getEthAmount(toWei(2000));
      expect(fromWei(ethOut)).to.equal("497.487437185929648241");
    });
  });
});
