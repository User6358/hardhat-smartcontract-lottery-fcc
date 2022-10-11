const { assert, expect } = require("chai")
const { network, getNamedAccounts, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Staging Tests", function () {
          let raffle, raffleEntranceFee, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          describe("fulfillRandomWords", function () {
              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
                  console.log("Setting up test...")
                  const startingTimeStamp = await raffle.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()

                  await new Promise(async (resolve, reject) => {
                      // Setup listener before we enter the raffle
                      // Just in case the blockchain moves really fast
                      console.log("Setting up Listener...")
                      raffle.once("WinnerPicked", async () => {
                          console.log("Winner Picked, event fired!")
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              // deployer is account 0 in hardhat.config.js
                              // There is only 1 participant so account 0 is of course the winner
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await raffle.getLatestTimeStamp()

                              await expect(raffle.getPlayer(0)).to.be.reverted
                              console.log("Players list reset => OK")
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              console.log("Recent winner is deployer => OK")
                              assert.equal(raffleState, 0)
                              console.log("Raffle is now open => OK")
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(raffleEntranceFee).toString()
                              )
                              console.log("Balance was given back to deployer => OK")
                              assert(endingTimeStamp > startingTimeStamp)
                              console.log("Time stamp updated => OK")
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      // Then entering the raffle
                      // This triggers performUpkeep since Chainlink sees checkUpkeep = true
                      console.log("Entering Raffle...")
                      tx = await raffle.enterRaffle({ value: raffleEntranceFee })
                      await tx.wait(1)
                      console.log("Ok, time to wait...")
                      const winnerStartingBalance = await accounts[0].getBalance()
                  })
                  console.log("Promise fulfilled!")
              })
          })
      })

// To test the contract on a testnet, make sure to
// 1. Get SubId for Chainlink VRF
// 2. Deploy contract using subId
// 3. Register contract with Chainlink VRF & its subId
// 4. Register contract with Chainlink Keepers
// 5. Run staging tests
