import styled from 'styled-components'
import { Badge } from '@material-ui/core'

import { useAccountExists, useTeamExists } from '../contexts/Client'
import Emoji from './Emoji'
import Chip from './Chip'
import NavButton from './NavButton'
import { Body } from './Type'
import Button from './Button'
import Updater from './Updater'

const Uniswap = styled.span`
  margin: 0;
  font-size: 1rem;
  color: ${({ theme, white }) => (white ? theme.colors.white : theme.colors.uniswap)};
  margin: 0 0.5rem 0 0.5rem;
  text-transform: none;
`

const L2Text = styled.span`
  font-style: oblique;
  font-size: 10px;
  font-weight: 700;
`

const StyledChip = styled(Chip)`
  height: 100%;
`

const HeaderButton = styled(Button)`
  min-height: unset;
  padding: 0.25rem;
  font-weight: 600;
`

const ButtonWrapper = styled.span`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const HomeButton = styled(NavButton)`
  padding: 1rem;
  line-height: 0rem;
`

const StyledBadge = styled(Badge)`
  .MuiBadge-badge {
    z-index: 0;
    color: ${({ theme }) => theme.colors.white};
    background-color: ${({ theme }) => theme.colors.link};
  }
`

const StyledUpdater = styled(Updater)`
  margin: 0 1.5rem 0 2rem;
`

export default function Header({ team, updateTotal, showIcons, showWallet, boostsLeft, setWalletModalIsOpen }) {
  const accountExists = useAccountExists()
  const teamExists = useTeamExists()

  return (
    <>
      <HomeButton href={accountExists && teamExists ? '/' : '/welcome'} variant="text">
        <Emoji emoji={'🦄'} label="unicorn" />
        <Uniswap>Uniswap</Uniswap>
        <StyledChip variant="gradient" label={<L2Text>L2</L2Text>} />
      </HomeButton>
      {showIcons && (
        <ButtonWrapper>
          <HeaderButton style={showWallet ? { marginRight: '1rem' } : {}} as={NavButton} variant="text" href="/stats">
            <Body textStyle="gradient">L2 Stats</Body>
          </HeaderButton>
          {showWallet && (
            <StyledBadge badgeContent={boostsLeft}>
              <HeaderButton
                variant="text"
                onClick={() => {
                  setWalletModalIsOpen(true)
                }}
              >
                <Body textStyle="gradient">Wallet</Body>
              </HeaderButton>
            </StyledBadge>
          )}
          <StyledUpdater team={team} total={updateTotal} />
        </ButtonWrapper>
      )}
    </>
  )
}
