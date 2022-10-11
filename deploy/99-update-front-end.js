const { frontEndContractsFile, frontEndAbiFile } = require("../helper-hardhat-config")
const { ethers, network } = require("hardhat")
// DO NOT ENTER const {fs} = require("fs")
const fs = require("fs")

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end...")
        updateContractAddresses()
        updateAbi()
        console.log("Front end written!")
    }
}

async function updateAbi() {
    const raffle = await ethers.getContract("Raffle")
    // interface retrieves the contract's abi
    fs.writeFileSync(frontEndAbiFile, raffle.interface.format(ethers.utils.FormatTypes.json))
}

async function updateContractAddresses() {
    const chainId = network.config.chainId
    const raffle = await ethers.getContract("Raffle")
    console.log(`contract address file: ${frontEndContractsFile}`)
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    if (chainId.toString() in contractAddresses) {
        if (!contractAddresses[chainId.toString()].includes(raffle.address)) {
            contractAddresses[chainId.toString()].push(raffle.address)
        }
    }
    {
        contractAddresses[chainId.toString()] = [raffle.address]
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}

module.exports.tags = ["all", "frontend"]
