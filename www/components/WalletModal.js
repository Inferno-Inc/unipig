import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { QRCode } from 'react-qrcode-logo'
import { Badge, Snackbar, SnackbarContent } from '@material-ui/core'
import { DialogOverlay, DialogContent } from '@reach/dialog'
import { useMotionValue, useAnimation, motion } from 'framer-motion'
import copy from 'copy-to-clipboard'
import styled from 'styled-components'
import { transparentize, lighten } from 'polished'

import { getPermissionString, truncateAddress } from '../utils'
import { useStyledTheme, usePrevious } from '../hooks'
import { useReset, Team } from '../contexts/Client'
import { AnimatedFrame, containerAnimationNoDelay } from './Animation'
import Button from './Button'
import Emoji from './Emoji'
import { WalletInfo, TokenInfo } from './MiniWallet'
import Shim from './Shim'
import { ButtonText } from './Type'
import NavButton from './NavButton'

const QRScanModal = dynamic(() => import('./QRScanModal'), { ssr: false })
const Confetti = dynamic(() => import('./Confetti'), { ssr: false })

const StyledDialogOverlay = styled(DialogOverlay)`
  &[data-reach-dialog-overlay] {
  }
`

const StyledDialogContent = styled(DialogContent)`
  &[data-reach-dialog-content] {
    display: flex;
    width: 100%;
    min-height: 100%;
    align-items: center;
    padding: 1rem;
    margin: 0 auto 0 auto;
    max-width: 448px;
    background-color: ${({ theme }) => transparentize(1, theme.colors.white)};
    @media only screen and (max-width: 480px) {
      padding: 0;
    }
  }
`

const CloseButton = styled(Button)`
  min-width: unset;
  min-height: unset;
  padding: 0.5rem;
  width: 3rem;
  height: 3rem;
  position: absolute;
  right: 16px;
  top: 16px;
`

const StyledWallet = styled.span`
  background-color: ${({ theme }) => lighten(0.05, theme.colors.black)};
  color: ${({ team, theme }) => (team === Team.UNI ? theme.colors[Team.UNI] : theme.colors[Team.PIGI])} !important;
  border-radius: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 1rem;
`

const StyledAction = styled.span`
  position: absolute;
  top: 8px;
  right: 8px;
`

const CodeBackground = styled.span`
  width: 100%;
  padding: 1.5rem;
  border-radius: 12px;
  background-color: ${({ team, theme }) =>
    team === Team.UNI ? theme.colors[Team.UNI] : theme.colors[Team.PIGI]} !important;
  color: black;
`

const WalletTitle = styled.span`
  text-decoration: none;
  font-weight: 600;
  opacity: 1;
  height: 24px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: -4px;
  margin-bottom: 1rem;
`

const QRCodeWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  position: relative;

  canvas {
    height: auto !important;
    border-radius: 20px !important;
    width: 90% !important;
    padding: 6% !important;
    background: rgb(250, 196, 182);
  }

  background-color: ${({ team, theme }) =>
    team === Team.UNI ? theme.colors[Team.UNI] : theme.colors[Team.PIGI]} !important;
`

const StyledAirdrop = styled.span`
  display: flex;
  justify-content: center;
`

const TwitterButton = styled(NavButton)`
  color: white;
  height: 48px;
  border-radius: 12px;
  min-height: unset;
  background-color: #1da1f2;
  :hover {
    background-color: rgba(29, 161, 242, 0.6);
  }
`

const StyledBadge = styled(Badge)`
  width: 100%;
  .MuiBadge-badge {
    color: ${({ theme }) => theme.colors.white};
    background-color: ${({ theme }) => theme.colors.link};
  }
`

const SendButton = styled(Button)`
  min-height: 36px;
  background: ${({ team, theme }) =>
    team === Team.UNI
      ? transparentize(0.8, theme.colors[Team.UNI])
      : transparentize(0.8, theme.colors[Team.PIGI])} !important;

  color: ${({ team, theme }) => (team === Team.UNI ? theme.colors[Team.UNI] : theme.colors[Team.PIGI])} !important;
`

const Description = styled.p`
  font-weight: 400;
  font-size: 12px;
  text-align: center;
  margin-bottom: 0px;
`

const ScanButton = styled(Button)`
  min-height: 36px;
  background: rgba(12, 12, 12, 1);
  color: white;
  border-radius: 12px;
  width: 100%;

  :hover {
    background: rgba(0, 0, 0, 0.7);
  }
`

const SendWrapper = styled.span`
  font-weight: 500;
  font-size: 12px;
  line-height: 15px;
  display: flex;
  flex-direction: row;

  ${SendButton} {
    flex-basis: 50%;
  }
`

const SendShim = styled.span`
  width: 8px;
  height: 8px;
`

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FilteredSnackbarContent = ({ inError, ...rest }) => <SnackbarContent {...rest} />
const StyledSnackbarContent = styled(FilteredSnackbarContent)`
  display: flex;
  flex-direction: row;
  background-color: ${({ inError, theme }) => (inError ? theme.colors.error : 'transparent')};
  ${({ theme }) => theme.gradientBackground};
  border-radius: 12px;
  width: 448px;

  @media screen and (max-width: 448) {
    width: 100%;
  }
`

const Contents = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
`

const ProgressSVG = styled.svg`
  height: 1.5rem;
  margin: 0.25rem;
`

const DURATION = 5
function AirdropSnackbar({ isError, scannedAddress, onCompletion }) {
  function statusMessage() {
    if (isError) {
      return <span>Oops! An error occurred, please try again.</span>
    } else {
      return (
        <span>
          <b>Boom. Airdrop complete.</b> <br /> <Shim size={8} /> You and{' '}
          {scannedAddress && truncateAddress(scannedAddress, 4)} just got tokens on the OVM. Layer two-kens, if you
          will.
        </span>
      )
    }
  }

  const pathLength = useMotionValue(0)
  const controls = useAnimation()
  const animateTo = duration => ({
    pathLength: 1,
    transition: { type: 'tween', duration, ease: 'linear' }
  })
  const [isFinished, setIsFinished] = useState(false)
  useEffect(() => {
    controls.start(animateTo(DURATION))
  }, [controls])

  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center'
      }}
      open={true}
      autoHideDuration={null}
      onClose={() => {}}
      onMouseEnter={() => {
        if (pathLength.isAnimating()) {
          controls.stop()
        }
      }}
      onMouseLeave={() => {
        if (pathLength.get() !== 0 && !pathLength.isAnimating() && !isFinished) {
          controls.start(animateTo(DURATION * (1 - pathLength.get())))
        }
      }}
      onExited={() => {
        setIsFinished(false)
        controls.set({ pathLength: 0 })
      }}
    >
      <StyledSnackbarContent
        inError={isError}
        message={
          <Contents>
            {/* <Emoji style={{ marginRight: '.75rem' }} emoji="📦" label="airdrop" /> */}
            {statusMessage()}
          </Contents>
        }
        action={
          <StyledAction>
            <ProgressSVG viewBox="0 0 50 50">
              <motion.path
                fill="none"
                strokeWidth="4"
                stroke="white"
                strokeDasharray="0 1"
                d="M 0, 20 a 20, 20 0 1,0 40,0 a 20, 20 0 1,0 -40,0"
                initial={false}
                style={{
                  pathLength,
                  rotate: 90,
                  translateX: 5,
                  translateY: 5,
                  scaleX: -1 // Reverse direction of line animation
                }}
                animate={controls}
                onAnimationComplete={() => {
                  setIsFinished(true)
                }}
              />
              <motion.path
                fill="none"
                strokeWidth="3"
                stroke="white"
                d="M14,26 L 22,33 L 35,16"
                initial={false}
                strokeDasharray="0 1"
                animate={{ pathLength: isFinished ? 1 : 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                onAnimationComplete={() => {
                  onCompletion()
                }}
              />
            </ProgressSVG>
            {/* <CloseButton
              style={{ margin: '0.25rem' }}
              onClick={() => {
                controls.start(animateTo(0.5))
              }}
            >
              <ButtonText>✗</ButtonText>
            </CloseButton> */}
          </StyledAction>
        }
      />
    </Snackbar>
  )
}

function Wallet({ wallet, team, addressData, OVMBalances, onDismiss, scannedAddress, openQRModal }) {
  const theme = useStyledTheme()

  const [addressCopied, setAddressCopied] = useState(false)
  useEffect(() => {
    if (addressCopied) {
      const timeout = setTimeout(() => {
        setAddressCopied(false)
      }, 1000)

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [addressCopied])
  function copyAddress() {
    copy(wallet.address)
    setAddressCopied(true)
  }

  const [accountCopied, setAccountCopied] = useState(false)
  useEffect(() => {
    if (accountCopied) {
      const timeout = setTimeout(() => {
        setAccountCopied(false)
      }, 1000)

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [accountCopied])
  function copyAccount() {
    copy(
      `${window.location.href}welcome?account=${
        wallet.mnemonic ? wallet.mnemonic.replace(/ /g, '-') : wallet.privateKey
      }&team=${Team[team]}&override=${true}`
    )
    setAccountCopied(true)
  }

  const [clickedChangeTeam, setClickedChangeTeam] = useState(false)
  useEffect(() => {
    if (clickedChangeTeam) {
      const timeout = setTimeout(() => {
        setClickedChangeTeam(false)
      }, 2000)

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [clickedChangeTeam])

  const reset = useReset()
  const [clickedBurnOnce, setClickedBurnOnce] = useState(false)
  useEffect(() => {
    if (clickedBurnOnce) {
      const timeout = setTimeout(() => {
        setClickedBurnOnce(false)
      }, 2000)

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [clickedBurnOnce])
  function manageBurn() {
    if (!clickedBurnOnce) {
      setClickedBurnOnce(true)
    } else {
      reset()
    }
  }

  return (
    <StyledWallet team={team}>
      <CodeBackground team={team}>
        <CloseButton
          team={team}
          onClick={() => {
            onDismiss()
          }}
        >
          <ButtonText>✗</ButtonText>
        </CloseButton>
        <WalletInfo
          setCopyAddress={copyAddress}
          showIcon={true}
          addressCopied={addressCopied}
          team={team}
          wallet={wallet}
        />

        {/* <Shim size={24} /> */}
        <QRCodeWrapper team={team} onClick={copyAddress}>
          <QRCode
            value={`https://unipig.exchange?referrer=${wallet.address}`}
            ecLevel="M"
            size={250}
            quietZone={100}
            bgColor={theme.colors[team]} // lighten(0.1, theme.colors[team])
            fgColor={theme.colors.black}
            qrStyle="squares"
          />
        </QRCodeWrapper>

        <Shim size={16} />
        {(addressData.boostsLeft || 0) !== 0 ? (
          <>
            <StyledAirdrop>
              <StyledBadge badgeContent={addressData.boostsLeft}>
                <ScanButton variant="contained" disabled={!!scannedAddress} onClick={openQRModal} stretch>
                  Trigger an Airdrop
                  <Emoji style={{ marginLeft: '0.3rem' }} emoji="📦" label="airdrop" />
                </ScanButton>
              </StyledBadge>
            </StyledAirdrop>
            <Description>
              Scan another player to trigger an airdrop. You'll both receive tokens from the Unipig faucet.
            </Description>
          </>
        ) : (
          <>
            <TwitterButton href={`/twitter-faucet`} stretch>
              Tweet to get tokens and airdrops.
            </TwitterButton>
            <Description>Or find other players and ask for an airdrop.</Description>
          </>
        )}
      </CodeBackground>

      <Shim size={24} />
      <WalletTitle>
        <span>Tokens</span>
      </WalletTitle>
      <TokenInfo team={team} OVMBalances={OVMBalances} />
      <Shim size={8} />
      <SendWrapper>
        <SendButton
          team={team}
          as={NavButton}
          href={`/send?token=${Team[team]}`}
          variant="text"
          disabled={OVMBalances[team] === 0}
        >
          Send
        </SendButton>
        <SendShim />
        <SendButton
          team={team === Team.UNI ? Team.PIGI : Team.UNI}
          as={NavButton}
          href={`/send?token=${Team[team === Team.UNI ? Team.PIGI : Team.UNI]}`}
          variant="text"
          disabled={OVMBalances[team === Team.UNI ? Team.PIGI : Team.UNI] === 0}
        >
          Send
        </SendButton>
      </SendWrapper>
      <Shim size={24} />
      <WalletTitle>
        <span>Manage Wallet</span>
      </WalletTitle>
      <SendWrapper>
        <SendButton team={team} variant="text" onClick={copyAddress}>
          {addressCopied ? 'Copied' : 'Copy Address'}
        </SendButton>
        <SendShim />
        <SendButton team={team} variant="text" onClick={copyAccount}>
          {accountCopied ? 'Copied' : 'Export Account'}
        </SendButton>
      </SendWrapper>
      <Shim size={8} />
      <SendWrapper>
        <SendButton
          team={team}
          as={clickedChangeTeam ? NavButton : undefined}
          href={clickedChangeTeam ? '/join-team?skipConfirm=true' : undefined}
          variant="text"
          onClick={
            clickedChangeTeam
              ? undefined
              : () => {
                  setClickedChangeTeam(true)
                }
          }
        >
          {clickedChangeTeam ? 'Just like that?' : 'Change Teams'}
        </SendButton>
        <SendShim />
        <SendButton team={team} variant="text" onClick={manageBurn}>
          {clickedBurnOnce ? 'Are you sure?' : 'Burn Account'}
        </SendButton>
      </SendWrapper>
    </StyledWallet>
  )
}

function ViewManager({ wallet, team, addressData, OVMBalances, onDismiss, scannedAddress, setScannedAddress }) {
  const [QRModalIsOpen, setQRModalIsOpen] = useState(false)

  return (
    <>
      <QRScanModal
        isOpen={QRModalIsOpen}
        onDismiss={() => {
          setQRModalIsOpen(false)
        }}
        onAddress={address => {
          setScannedAddress(address)
          setQRModalIsOpen(false)
        }}
      />
      <Wallet
        wallet={wallet}
        team={team}
        addressData={addressData}
        OVMBalances={OVMBalances}
        onDismiss={onDismiss}
        scannedAddress={scannedAddress}
        openQRModal={() => {
          setQRModalIsOpen(true)
        }}
      />
    </>
  )
}

export default function WalletModal({
  wallet,
  team,
  addressData,
  updateAddressData,
  OVMBalances,
  updateOVMBalances,
  isOpen,
  onDismiss
}) {
  const [scannedAddress, setScannedAddress] = useState()
  const lastScannedAddress = usePrevious(scannedAddress)

  const [error, setError] = useState()
  const [success, setSuccess] = useState()

  const [signature, setSignature] = useState()
  useEffect(() => {
    if (!signature && wallet && scannedAddress) {
      const permissionString = getPermissionString(wallet.address)
      wallet.signMessage(permissionString).then(signature => {
        setSignature(signature)
      })
    }
  }, [signature, wallet, scannedAddress])

  const walletAddress = wallet && wallet.address
  useEffect(() => {
    if (walletAddress && scannedAddress && signature) {
      Promise.all([
        fetch('/api/airdrop', {
          method: 'POST',
          body: JSON.stringify({ address: walletAddress, signature, scannedAddress })
        }),
        new Promise(resolve => {
          setTimeout(resolve, 500)
        })
      ])
        .then(([response]) => {
          if (!response.ok) {
            throw Error(`${response.status} Error: ${response.statusText}`)
          }

          updateOVMBalances()
          updateAddressData()
          setSuccess(true)
        })
        .catch(error => {
          console.error(error)
          setError(true)
        })
    }
  }, [walletAddress, scannedAddress, signature, updateOVMBalances, updateAddressData])

  function onCompletion() {
    setError()
    setSuccess()
    setScannedAddress()
  }

  useEffect(() => {
    if (!isOpen) {
      onCompletion()
    }
  }, [isOpen])

  // handle redirect after reset
  const router = useRouter()
  useEffect(() => {
    if (wallet === null) {
      router.push('/welcome')
    }
  }, [wallet, router])
  if (wallet === null) {
    return null
  }

  return (
    <>
      <StyledDialogOverlay isOpen={isOpen} onDismiss={onDismiss}>
        <StyledDialogContent>
          <Confetti start={success} variant="top" />
          {!!(error || success) && (
            <AirdropSnackbar
              isError={!!error}
              scannedAddress={scannedAddress || lastScannedAddress}
              onCompletion={onCompletion}
            />
          )}
          <AnimatedFrame variants={containerAnimationNoDelay} initial="hidden" animate="show">
            <ViewManager
              wallet={wallet}
              team={team}
              addressData={addressData}
              OVMBalances={OVMBalances}
              onDismiss={onDismiss}
              scannedAddress={scannedAddress}
              setScannedAddress={setScannedAddress}
            />
          </AnimatedFrame>
        </StyledDialogContent>
      </StyledDialogOverlay>
    </>
  )
}
