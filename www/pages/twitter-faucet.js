import { useEffect, useState } from 'react'
import styled from 'styled-components'

import { getPermissionString } from '../utils'
import { Team, useWallet, useTeam, WalletSource, useSource, useAddSource } from '../contexts/Cookie'
import NavButton from '../components/NavButton'

const Tweet = styled.a`
  visibility: ${({ loaded }) => (loaded ? 'visible' : 'hidden')};
`

async function getFaucetData(address, time, signature) {
  return await fetch(`/api/get-twitter-faucet-data`, {
    method: 'POST',
    body: JSON.stringify({ address, time, signature })
  })
    .then(async response => {
      if (!response.ok) {
        throw Error('Invalid response.')
      }

      return await response.json()
    })
    .catch(error => {
      console.error(error)
      return null
    })
}

export default function TwitterFaucet() {
  const source = useSource()
  const wallet = useWallet()
  const team = useTeam()

  // get a permission signature
  const [permission, setPermission] = useState()
  useEffect(() => {
    const permission = getPermissionString(wallet.address)
    wallet.signMessage(permission.permissionString).then(signature => {
      setPermission({ time: permission.time, signature })
    })
  }, [wallet])

  // get faucet data ASAP
  const [faucetData, setFaucetData] = useState()
  useEffect(() => {
    if (permission) {
      getFaucetData(wallet.address, permission.time, permission.signature).then(setFaucetData)
    }
  }, [permission, wallet])

  // polling logic to check for valid tweet
  const [polling, setPolling] = useState(false)
  useEffect(() => {
    if (permission) {
      if (polling) {
        function poll() {
          getFaucetData(wallet.address, permission.time, permission.signature).then(setFaucetData)
        }

        const interval = setInterval(poll, 5000)
        return () => {
          clearInterval(interval)
        }
      }
    }
  }, [permission, polling, wallet])

  // initialize twitter stuff when we need it
  const [twitterLoaded, setTwitterLoaded] = useState(false)
  useEffect(() => {
    if (faucetData && faucetData.canFaucet) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('scriptjs')('https://platform.twitter.com/widgets.js', () => {
        window.twttr.events.bind('loaded', () => {
          setTwitterLoaded(true)
        })

        window.twttr.events.bind('tweet', () => {
          setPolling(true)
        })
      })
    }
  }, [faucetData])

  // set wallet source once twitter is successful (we could do this on the home screen as well...?)
  const addSource = useAddSource()
  useEffect(() => {
    if (faucetData && !faucetData.canFaucet && source !== WalletSource.TWITTER) {
      addSource(WalletSource.TWITTER)
    }
  })

  function metaInformation() {
    if (faucetData === null) {
      return <p>error</p>
    } else if (faucetData === undefined) {
      return <p>loading...</p>
    } else if (faucetData.canFaucet && !twitterLoaded) {
      return <p>loading...</p>
    } else if (faucetData.canFaucet && polling) {
      return <p>waiting...</p>
    }
  }

  return (
    <>
      <h1>tweet your support to get tokens</h1>

      {metaInformation()}

      {faucetData && !faucetData.canFaucet && (
        <>
          <p>Coming through loud and clear @{faucetData.twitterHandle}!</p>
          <NavButton variant="gradient" href="/" disabled={source !== WalletSource.TWITTER}>
            Dope
          </NavButton>
        </>
      )}

      <div>
        <Tweet
          loaded={faucetData && faucetData.canFaucet && twitterLoaded}
          className="twitter-share-button"
          href="https://twitter.com/intent/tweet"
          data-size="large"
          data-text={`༼ つ ◕_◕ ༽つ
@UnipigExchange please give 🦄UNI and 🐷PIGI tokens to my Layer 2 wallet ${wallet.address}`}
          data-url="https://unipig.exchange"
          data-hashtags={`team${team === Team.UNI ? 'UNI' : 'PIGI'}`}
          data-dnt="true"
        >
          Tweet
        </Tweet>
      </div>
    </>
  )
}
