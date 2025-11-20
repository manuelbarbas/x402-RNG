# x402-RNG

## Overview

This project demonstrates the integration of SKALE Chain's Random Number Generator (RNG) with the x402 protocol for monetized resource access. Users must pay through the x402 protocol to fetch a random word generated using SKALE's on-chain RNG.

## Goal

Provide random word generation as a paid service where access is gated by x402 protocol payments. The random words are generated using SKALE Chain's native RNG functionality.

## Components

### Contracts

Smart contracts deployed on SKALE Chain that handle random number generation and word selection.

- `SkaleWordRandom.sol` - Generates random words using SKALE's RNG

### Application

#### x402-skale-rng-seller

Backend service that provides the random word generation endpoint. Validates x402 protocol payments before serving random words to clients.

#### x402-skale-rng-buyer

Frontend application that allows users to request random words. Handles x402 protocol payment flow and displays the fetched random word.

## Architecture

1. User initiates a request for a random word through the buyer application
2. Buyer application processes payment through x402 protocol
3. Payment verification is sent to the seller service
4. Seller service validates the x402 payment
5. Upon successful validation, seller fetches a random word from the smart contract
6. Random word is returned to the buyer application

## Technology Stack

- SKALE Chain for on-chain RNG
- x402 protocol for payment processing
- Solidity smart contracts
- TypeScript/JavaScript for application layer
