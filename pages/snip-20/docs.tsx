import Head from 'next/head'
import { useRouter } from 'next/router'
import { createRef, PropsWithChildren, useEffect, useMemo, useState } from 'react'
import type { FormEventHandler } from 'react'
import type { GetTokenParamsResponse } from 'secretjs/dist/extensions/snip20/types'
import type { Permit } from 'secretjs'
import { CopyBlock, atomOneDark } from 'react-code-blocks'

import { DeployconttractsLogo } from '@/components/DeployconttractsLogo'
import PrimaryButton from '@/components/buttons/PrimaryButton'

import { useSecretClient } from '@/hooks/secret-client-hook'
import type { UseSecretClientProps } from '@/hooks/secret-client-hook'

import { configuration } from '@/lib/secret-client'
import { create as createSecretAddress } from '@/lib/snip20-token-creator/entity/secret-address'

import { useLocalStorage } from '@/utils/useLocalStorage'

import Doc from '@/components/docs/Doc'

type TokenInfo = GetTokenParamsResponse['token_info']

interface MetaState {
  connectedWalletAddress?: string
  addressToCodeHash: {
    [address: string]: string
  }
  permits: {
    [contractAddress: string]: Permit
  }
}

interface DocsPageProps extends UseSecretClientProps {
  metaStorageKey: string
}

function createDefaultProps(): DocsPageProps {
  return {
    ...configuration,
    metaStorageKey: 'snip-20-docs/meta',
  }
}

export default function DocsPage({ chainSettings, metaStorageKey }: DocsPageProps = createDefaultProps()) {
  const router = useRouter()
  const secretClient = useSecretClient({ chainSettings })
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>()
  const [metaState, setMetaState] = useLocalStorage<MetaState>(metaStorageKey, {
    addressToCodeHash: {},
    permits: {},
  })

  const [balanceOutput, setBalanceOutput] = useState('')
  const [transferHistoryOutput, setTransferHistoryOutput] = useState('')
  const [transactionHistoryOutput, setTransactionHistoryOutput] = useState('')
  const [allowanceOutput, setAllowanceOutput] = useState('')
  const [sendOutput, setSendOutput] = useState('')
  const [transferOutput, setTransferOutput] = useState('')
  const [increaseAllowanceOutput, setIncreaseAllowanceOutput] = useState('')
  const [decreaseAllowanceOutput, setDecreaseAllowanceOutput] = useState('')

  const formValueExample = ({ formName, fieldName, defaultValue }: any): any => {
    if (typeof document === 'undefined') {
      return defaultValue
    }

    // @ts-ignore
    return document.forms.namedItem(formName)?.elements[fieldName]?.value || defaultValue
  }

  const scrollIntoView = (ref: any) => () => {
    ref.current.scrollIntoView({ behavior: 'smooth' })
  }

  const startingRef = createRef()
  const scrollToStarting = scrollIntoView(startingRef)
  const installationRef = createRef()
  const scrollToInstallation = scrollIntoView(installationRef)
  const queryBalanceRef = createRef()
  const scrollToQueryBalance = scrollIntoView(queryBalanceRef)
  const queryTransferHistoryRef = createRef()
  const scrollToTransferHistory = scrollIntoView(queryTransferHistoryRef)
  const queryTransactionHistoryRef = createRef()
  const scrollToTransactionHistory = scrollIntoView(queryTransactionHistoryRef)
  const queryAllowanceRef = createRef()
  const scrollToAllowance = scrollIntoView(queryAllowanceRef)
  const txSendRef = createRef()
  const scrollToSend = scrollIntoView(txSendRef)
  const txTransferRef = createRef()
  const scrollToTransfer = scrollIntoView(txTransferRef)
  const txIncreaseAllowanceRef = createRef()
  const scrollToIncreaseAllowance = scrollIntoView(txIncreaseAllowanceRef)
  const txDecreaseAllowanceRef = createRef()
  const scrollToDecreaseAllowance = scrollIntoView(txDecreaseAllowanceRef)

  // TODO: dynamic Page size on query
  const PAGE_SIZE = 10

  const contractAddress = useMemo(() => {
    if (typeof router.query.token !== 'string') {
      return null
    }

    console.log('contractAddress', router.query.token)

    try {
      return createSecretAddress(router.query.token)
    } catch (error) {
      console.error(error)
      return null
    }
  }, [router.query.token])

  const contractCodeHash = useMemo(
    () => (contractAddress ? metaState.addressToCodeHash[contractAddress] : null),
    [contractAddress, metaState.addressToCodeHash],
  )

  // trying to connect to Keplr automatically
  useEffect(() => {
    if (secretClient.connectedWalletAddress) {
      // wallet is already connected, skip
      return
    }

    if (!metaState.connectedWalletAddress) {
      // connected wallet address has not been stored during previous session, skip
      return
    }

    // only call it when the user has connected walled during previous sessions
    console.info('Requesting Secret Client connection automatically')
    secretClient.connectWallet().then((walletAddress) => console.log('automatically connected', { walletAddress }))
  }, [secretClient])

  // store most recently used wallet address
  useEffect(() => {
    setMetaState((metaState) => ({ ...metaState, connectedWalletAddress: secretClient.connectedWalletAddress }))
  }, [secretClient.connectedWalletAddress])

  // get code hash for the current contract address
  // code hash is needed for further queries
  useEffect(() => {
    if (!contractAddress || !secretClient.isReady) {
      return
    }

    secretClient.inner?.query.compute
      .contractCodeHash(contractAddress)
      .then((codeHash) =>
        setMetaState(({ addressToCodeHash, ...metaState }) => ({
          ...metaState,
          addressToCodeHash: {
            ...addressToCodeHash,
            [contractAddress]: codeHash,
          },
        })),
      )
      .catch((error) => {
        // something went wrong and code hash could not be fetched
        // TODO: figure out what to do here
        console.error(error)
      })
  }, [contractAddress, secretClient.isReady])

  // query basic contract info automatically (if possible)
  useEffect(() => {
    if (!secretClient.isReady || !contractAddress || !contractCodeHash) {
      return
    }

    secretClient.inner?.query.snip20
      .getSnip20Params({ contract: { address: contractAddress, codeHash: contractCodeHash } })
      .then(({ token_info: tokenInfo }) => setTokenInfo(tokenInfo))
      .catch((error) => {
        // something went wrong and contract information could not be fetched
        // TODO: figure out what to do here
        console.error(error)
      })
  }, [contractAddress, contractCodeHash, secretClient.isReady])

  // Expose namespaced values so users could play in the console
  useEffect(() => {
    // @ts-ignore
    window['secretClient'] = secretClient.inner
    // @ts-ignore
    window['contractAddress'] = contractAddress
    // @ts-ignore
    window['contractCodeHash'] = contractCodeHash
    // @ts-ignore
    window['getPermit'] = getPermit
    // @ts-ignore
    window['PAGE_SIZE'] = PAGE_SIZE
  })

  const signPermit = async () => {
    const useKelpAsSigner = true

    const permit = await secretClient.inner!.utils.accessControl.permit.sign(
      secretClient.connectedWalletAddress!,
      chainSettings.chainId,
      'deploycontracts.io/docs',
      [contractAddress!],
      ['owner', 'history', 'balance', 'allowance'],
      useKelpAsSigner,
    )

    const storageKey = `${secretClient.connectedWalletAddress}:${contractAddress}`

    setMetaState(({ permits, ...metaState }) => ({
      ...metaState,
      permits: {
        ...permits,
        [storageKey]: permit,
      },
    }))

    return permit
  }

  const getPermit = async () => {
    const storageKey = `${secretClient.connectedWalletAddress}:${contractAddress}`
    const storageValue = metaState.permits[storageKey]

    return storageValue || (await signPermit())
  }

  // ------ SNIP20: Queries ------
  // Query: getBalance
  const handleGetBalance: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    const txQuery = await secretClient.inner?.query.snip20.getBalance({
      address: secretClient.connectedWalletAddress!,
      contract: { address: contractAddress!, codeHash: contractCodeHash! },
      auth: {
        permit: await getPermit(),
      },
    })
    setBalanceOutput(JSON.stringify(txQuery, null, 2))
  }

  // Query: getTransferHistory
  const handleGetTransferHistory: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    const txQuery = await secretClient.inner?.query.snip20.getTransferHistory({
      address: secretClient.connectedWalletAddress!,
      contract: { address: contractAddress!, codeHash: contractCodeHash! },
      auth: { permit: await getPermit() },
      page_size: PAGE_SIZE,
    })

    setTransferHistoryOutput(JSON.stringify(txQuery, null, 2))
  }

  // Query: getTransactionHistory
  const handleGetTransactionHistory: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    const txQuery = await secretClient.inner?.query.snip20.getTransactionHistory({
      address: secretClient.connectedWalletAddress!,
      contract: { address: contractAddress!, codeHash: contractCodeHash! },
      auth: { permit: await getPermit() },
      page_size: PAGE_SIZE,
    })

    setTransactionHistoryOutput(JSON.stringify(txQuery, null, 2))
  }

  // Query: GetAllowance
  const handleGetAllowance: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    const txQuery = await secretClient.inner?.query.snip20.GetAllowance({
      contract: { address: contractAddress!, codeHash: contractCodeHash! },
      owner: secretClient.connectedWalletAddress!,
      spender: formData.get('allowanceSpender')!.toString(),
      auth: { permit: await getPermit() },
    })

    setAllowanceOutput(JSON.stringify(txQuery, null, 2))
  }

  // ------ SNIP20: TXs ------
  // TX: send
  const handleSend: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    try {
      setSendOutput('Sending a TX ...')
      const txExec = await secretClient.inner?.tx.snip20.send(
        {
          sender: secretClient.connectedWalletAddress!,
          contractAddress: contractAddress!,
          codeHash: contractCodeHash!,
          msg: {
            send: {
              recipient: formData.get('sendRecipient')!.toString(),
              amount: formData.get('sendAmount')!.toString(),
            },
          },
        },
        {
          gasLimit: 5_000_000,
        },
      )
      setSendOutput(`OK, transactionHash: ${txExec!.transactionHash}`)
    } catch (error) {
      setSendOutput(JSON.stringify(error, null, 2))
    }
  }
  // TX: transfer
  const handleTransfer: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    try {
      setTransferOutput('Sending a TX ...')

      const txExec = await secretClient.inner?.tx.snip20.transfer(
        {
          sender: secretClient.connectedWalletAddress!,
          contractAddress: contractAddress!,
          codeHash: contractCodeHash!,
          msg: {
            transfer: {
              recipient: formData.get('transferRecipient')!.toString(),
              amount: formData.get('transferAmount')!.toString(),
            },
          },
        },
        {
          gasLimit: 5_000_000,
        },
      )
      setTransferOutput(`OK, transactionHash: ${txExec!.transactionHash}`)
    } catch (error) {
      setTransferOutput(JSON.stringify(error, null, 2))
    }
  }

  // TX: increaseAllowance
  const handleIncreaseAllowance: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    try {
      setIncreaseAllowanceOutput('Sending a TX ...')
      const txExec = await secretClient.inner?.tx.snip20.increaseAllowance(
        {
          sender: secretClient.connectedWalletAddress!,
          contractAddress: contractAddress!,
          codeHash: contractCodeHash!,
          msg: {
            increase_allowance: {
              spender: formData.get('increaseAllowanceSpender')!.toString(),
              amount: formData.get('increaseAllowanceAmount')!.toString(),
            },
          },
        },
        {
          gasLimit: 5_000_000,
        },
      )
      setIncreaseAllowanceOutput(`OK, transactionHash: ${txExec!.transactionHash}`)
    } catch (error) {
      setIncreaseAllowanceOutput(JSON.stringify(error, null, 2))
    }
  }
  // TX: decreaseAllowance
  const handleDecreaseAllowance: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    try {
      setDecreaseAllowanceOutput('Sending a TX ...')
      const txExec = await secretClient.inner?.tx.snip20.decreaseAllowance(
        {
          sender: secretClient.connectedWalletAddress!,
          contractAddress: contractAddress!,
          codeHash: contractCodeHash!,
          msg: {
            decrease_allowance: {
              spender: formData.get('decreaseAllowanceSpender')!.toString(),
              amount: formData.get('decreaseAllowanceAmount')!.toString(),
            },
          },
        },
        {
          gasLimit: 5_000_000,
        },
      )
      setDecreaseAllowanceOutput(`OK, transactionHash: ${txExec!.transactionHash}`)
    } catch (error) {
      setDecreaseAllowanceOutput(JSON.stringify(error, null, 2))
    }
  }

  return (
    <>
      <Head>
        <title>SNIP-20 token details | Deploy Contracts</title>
        <meta name='description' content={`Use a simple web form to interact with any SNIP-20 smart contract.`} />
      </Head>

      <header className='sticky top-0 z-50 flex flex-wrap items-center justify-between px-4 py-5 shadow-md shadow-slate-900/5 transition duration-500 shadow-none sm:px-6 lg:px-8 bg-[#071741] md:bg-transparent max-w-screen-2xl mx-auto'>
        <div className='relative flex flex-grow basis-0 items-center'>
          <a className='block w-10 lg:w-auto' href='/'>
            <span className='sr-only'>Home page</span>
            <DeployconttractsLogo className='w-64 h-9 cursor-pointer shrink-0' />
          </a>
        </div>
        <div className='relative flex basis-0 justify-end space-x-6 sm:space-x-8 md:flex-grow'>
          <a
            className='group'
            href='https://github.com/tukwan/deploycontracts.io'
            target='_blank'
            rel='noopener noreferrer'
          >
            <span className='sr-only'>GitHub</span>
            <svg aria-hidden='true' viewBox='0 0 16 16' className='h-6 w-6 fill-slate-400 group-hover:fill-slate-300'>
              <path d='M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z'></path>
            </svg>
          </a>
        </div>
      </header>

      <div className='relative mx-auto flex justify-center sm:px-2 lg:px-8 xl:px-12'>
        <div className='hidden lg:relative lg:block lg:flex-none'>
          <div className='sticky top-[4.5rem] -ml-0.5 h-[calc(100vh-4.5rem)] overflow-y-auto py-16 pl-0.5'>
            <div className='absolute top-16 bottom-0 right-0 h-12 w-px bg-gradient-to-t from-slate-700 block' />
            <div className='absolute top-28 bottom-0 right-0 w-px bg-slate-700 block' />
            <nav className='text-base lg:text-sm w-64 pr-8 xl:w-72 xl:pr-16'>
              <ul className='space-y-9'>
                <li>
                  <h2 className='font-display font-medium text-white'>Introduction</h2>
                  <ul className='mt-2 space-y-2 border-l-2 border-slate-700 lg:mt-4 lg:space-y-4'>
                    <li className='relative'>
                      <a
                        className='cursor-pointer block w-full pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full text-slate-500 before:hidden before:bg-slate-600 hover:text-slate-600 hover:before:block text-slate-400 before:bg-slate-700 hover:text-slate-300'
                        onClick={scrollToStarting}
                      >
                        Getting started
                      </a>
                    </li>
                    <li className='relative'>
                      <a
                        className='cursor-pointer block w-full pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full text-slate-500 before:hidden before:bg-slate-600 hover:text-slate-600 hover:before:block text-slate-400 before:bg-slate-700 hover:text-slate-300'
                        onClick={scrollToInstallation}
                      >
                        Installation
                      </a>
                    </li>
                  </ul>
                </li>
                <li>
                  <h2 className='font-display font-medium text-white'>SNIP-20 Queries</h2>
                  <ul className='mt-2 space-y-2 border-l-2 border-slate-700 lg:mt-4 lg:space-y-4'>
                    <li className='relative'>
                      <a
                        className='cursor-pointer block w-full pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full text-slate-500 before:hidden before:bg-slate-600 hover:text-slate-600 hover:before:block text-slate-400 before:bg-slate-700 hover:text-slate-300'
                        onClick={scrollToQueryBalance}
                      >
                        Get Balance
                      </a>
                    </li>
                    <li className='relative'>
                      <a
                        className='cursor-pointer block w-full pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full text-slate-500 before:hidden before:bg-slate-600 hover:text-slate-600 hover:before:block text-slate-400 before:bg-slate-700 hover:text-slate-300'
                        onClick={scrollToTransferHistory}
                      >
                        Get Transfer History
                      </a>
                    </li>
                    <li className='relative'>
                      <a
                        className='cursor-pointer block w-full pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full text-slate-500 before:hidden before:bg-slate-600 hover:text-slate-600 hover:before:block text-slate-400 before:bg-slate-700 hover:text-slate-300'
                        onClick={scrollToTransactionHistory}
                      >
                        Get Transaction History
                      </a>
                    </li>
                    <li className='relative'>
                      <a
                        className='cursor-pointer block w-full pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full text-slate-500 before:hidden before:bg-slate-600 hover:text-slate-600 hover:before:block text-slate-400 before:bg-slate-700 hover:text-slate-300'
                        onClick={scrollToAllowance}
                      >
                        Get Allowance
                      </a>
                    </li>
                  </ul>
                </li>
                <li>
                  <h2 className='font-display font-medium text-white'>SNIP-20 Transactions</h2>
                  <ul className='mt-2 space-y-2 border-l-2 border-slate-700 lg:mt-4 lg:space-y-4'>
                    <li className='relative'>
                      <a
                        className='cursor-pointer block w-full pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full text-slate-500 before:hidden before:bg-slate-600 hover:text-slate-600 hover:before:block text-slate-400 before:bg-slate-700 hover:text-slate-300'
                        onClick={scrollToSend}
                      >
                        Send
                      </a>
                    </li>
                    <li className='relative'>
                      <a
                        className='cursor-pointer block w-full pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full text-slate-500 before:hidden before:bg-slate-600 hover:text-slate-600 hover:before:block text-slate-400 before:bg-slate-700 hover:text-slate-300'
                        onClick={scrollToTransfer}
                      >
                        Transfer
                      </a>
                    </li>
                    <li className='relative'>
                      <a
                        className='cursor-pointer block w-full pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full text-slate-500 before:hidden before:bg-slate-600 hover:text-slate-600 hover:before:block text-slate-400 before:bg-slate-700 hover:text-slate-300'
                        onClick={scrollToIncreaseAllowance}
                      >
                        Increase Allowance
                      </a>
                    </li>
                    <li className='relative'>
                      <a
                        className='cursor-pointer block w-full pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full text-slate-500 before:hidden before:bg-slate-600 hover:text-slate-600 hover:before:block text-slate-400 before:bg-slate-700 hover:text-slate-300'
                        onClick={scrollToDecreaseAllowance}
                      >
                        Decrease Allowance
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <article className='min-w-0 max-w-2xl flex-auto px-4 py-16 lg:max-w-6xl lg:pr-0 lg:pl-8 xl:px-16'>
          <section className='mb-12'>
            <header className='mb-2 space-y-1'>
              <em className='font-display text-sm font-medium text-[#FD0F9E]'>Introduction</em>
              <h1
                ref={startingRef as React.RefObject<HTMLHeadingElement>}
                className='font-display text-3xl tracking-tight text-white'
              >
                Getting started
              </h1>
            </header>
            <Paragraph>
              Check basic token information. Provide the address of chosen token contract and click "Load".
            </Paragraph>
            <form className='mt-5 mb-5 sm:flex sm:items-center'>
              <div className='max-w-xs'>
                <label htmlFor='snip20-addr' className='sr-only'>
                  SNIP-20 address
                </label>
                <input
                  type='text'
                  name='token'
                  id='snip20-addr'
                  className='input py-4 px-5 bg-[#000B28] text-base border-2 border-[#455378] rounded-2xl text-gray-100 placeholder:text-gray-300 visited:border-[#6075AA]'
                  placeholder='secret1zmanyjc75yx30ph3lnd9tk3hze5f2lm9fyp5xt'
                  defaultValue={router.query.token}
                />
              </div>
              <PrimaryButton
                type='submit'
                className='mt-3 w-full inline-flex items-center justify-center px-4 py-2 shadow-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
              >
                Load
              </PrimaryButton>
              {secretClient.isReadOnly && (
                <PrimaryButton
                  onClick={secretClient.connectWallet}
                  type='button'
                  className='mt-3 w-full inline-flex items-center justify-center px-4 py-2 shadow-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  Connect wallet
                </PrimaryButton>
              )}
            </form>
          </section>
          <section className='my-12'>
            <h2 className='text-white text-lg'>Token Info</h2>
            <div className='my-4'>
              <CopyBlock
                text={tokenInfo ? JSON.stringify(tokenInfo, undefined, 2) : 'Data loading...'}
                theme={atomOneDark}
                language='json'
                wrapLines
                customStyle={{ overflowWrap: 'break-word', fontSize: '1rem', padding: '1rem' }}
              />
            </div>
            {tokenInfo && (
              <Paragraph>
                Seeing basic information is nice, but what if you wanted to integrate your token into a website? Let's
                keep going!
              </Paragraph>
            )}

            <Paragraph>
              <strong>Side note:</strong> In the code examples down the page, we'll use <code>contractAddress</code> and{' '}
              <code>contractCodeHash</code> variables. You can access both of them in the developer console. Take a
              small break and give it a try!
            </Paragraph>
            <div className='my-4'>
              <CopyBlock
                text={`const contractAddress = "${contractAddress}"
const contractCodeHash = "${contractCodeHash}"`}
                theme={atomOneDark}
                language='js'
                wrapLines
                customStyle={{ overflowWrap: 'break-word', fontSize: '1rem', padding: '1rem' }}
              />
            </div>
            <Paragraph>
              Remember! They are based on the token contract address you provided at the very top of this page.
            </Paragraph>
          </section>
          <section className='my-12'>
            <h2 ref={installationRef as React.RefObject<HTMLHeadingElement>} className='text-white text-lg'>
              Installation
            </h2>
            <Paragraph>
              If you want your website to communicate with the Secret Network, you'll need a client set up to connect to
              the blockchain.
            </Paragraph>
            <Paragraph>
              Let's assume we need to add the client to the website. We'll use{' '}
              <a
                href='https://docs.scrt.network/docs/development/api-endpoints#grpc-web'
                target='_blank'
                rel='noreferrer'
              >
                an example
              </a>{' '}
              provided in the official documentation. It shows how to configure a gRPC client to Secret Network.
            </Paragraph>

            <Paragraph>First, we'll install the NPM package, which includes Secret Network JS SDK:</Paragraph>
            <div className='my-4'>
              <CopyBlock
                text={`npm install secretjs@beta
# OR
yarn add secretjs@beta`}
                theme={atomOneDark}
                language='bash'
                wrapLines
                customStyle={{ overflowWrap: 'break-word', fontSize: '1rem', padding: '1rem' }}
              />
            </div>

            <Paragraph>
              Now, we can initialise the client. We'll need the{' '}
              <a href='https://www.keplr.app' target='_blank' rel='noreferrer'>
                Keplr browser extension
              </a>{' '}
              to sign transactions and access control permits. Of course, we also need to know which network we'd like
              to connect to. Check out the example below:
            </Paragraph>

            <CopyBlock
              text={`import { SecretNetworkClient } from "secretjs";
// Connection data is available on this page:
// https://docs.scrt.network/docs/development/api-endpoints

// We'll go ahead with the testnet connection
const grpcWebUrl = "https://testnet-web-rpc.roninventures.io";
const chainId = "pulsar-2";

// A client with Keplr integration — Keplr is the signer
await window.keplr.enable(chainId)
const [{ address: myAddress }] = await keplrOfflineSigner.getAccounts()

const secretClient = await SecretNetworkClient.create({
  grpcWebUrl,
  chainId,
  wallet: window.getOfflineSignerOnlyAmino(chainId),
  walletAddress: myAddress,
  encryptionUtils: window.getEnigmaUtils(chainId),
})`}
              theme={atomOneDark}
              language='ts'
              wrapLines
              customStyle={{ overflowWrap: 'break-word', fontSize: '1rem', padding: '1rem' }}
            />
            <Paragraph>
              This website has one up and running. You can check it in the developer console. Just type{' '}
              <code>secretClient</code> and see what it's got for you!
            </Paragraph>
          </section>
          <section className='my-12'>
            <header className='mt-10 mb-4 space-y-1'>
              <em className='font-display text-sm font-medium text-[#FD0F9E]'>Reading data</em>
              <h1 className='font-display text-3xl tracking-tight text-white'>SNIP-20 Queries</h1>
            </header>
            <Paragraph>
              Below you'll find so-called authenticated queries. It means that the contract has to know who sent the
              query to apply access control correctly. We'll use permits to prove who we are.
            </Paragraph>
            {secretClient.isReadOnly && (
              <div className='text-white bg-[#FD0F9E]/80 p-5 font-black my-10'>
                <button onClick={secretClient.connectWallet} className='underline underline-offset-4'>
                  Connect wallet
                </button>{' '}
                to interact with queries
              </div>
            )}
            <Doc
              name='Get Balance'
              secretClient={secretClient}
              onSubmit={handleGetBalance}
              output={balanceOutput}
              text={
                <>
                  Returns the balance of the given address. Returns <code>0</code> if the address is unknown to the
                  contract.
                </>
              }
              codeBlock={`await secretClient.query.snip20.getBalance({
  address: secretClient.address,
  contract: { address: contractAddress, codeHash: contractCodeHash },
  auth: { permit: await getPermit()
}})`}
              refScroll={queryBalanceRef}
            />
            <Doc
              name='Get Transfer History'
              secretClient={secretClient}
              onSubmit={handleGetTransferHistory}
              output={transferHistoryOutput}
              text={
                <>
                  Returns a list of transfers made by the querying address in the newest-first order. The user may
                  optionally specify a limit on the number of transfers returned by paging the available items.
                </>
              }
              codeBlock={`await secretClient.query.snip20.getTransferHistory({
  address: secretClient.address,
  contract: { address: contractAddress, codeHash: contractCodeHash },
  auth: { permit: await getPermit() },
  page_size: PAGE_SIZE
})`}
              refScroll={queryTransferHistoryRef}
            />
            <Doc
              name='Get Transaction History'
              secretClient={secretClient}
              onSubmit={handleGetTransactionHistory}
              output={transactionHistoryOutput}
              text={
                <>
                  Returns a list of transactions made by the querying address in the newest-first order. The user may
                  optionally specify a limit on the number of transactions returned by paging the available items.
                </>
              }
              codeBlock={`await secretClient.query.snip20.getTransactionHistory({
  address: secretClient.address,
  contract: { address: contractAddress, codeHash: contractCodeHash },
  auth: { permit: await getPermit() },
  page_size: PAGE_SIZE
})`}
              refScroll={queryTransactionHistoryRef}
            />
            <Doc
              name='Get Allowance'
              secretClient={secretClient}
              onSubmit={handleGetAllowance}
              output={allowanceOutput}
              text={
                <>
                  Returns the number of tokens delegated by the owner to the spender. It's a similar feature to the
                  ERC-20 allowances.
                </>
              }
              codeBlock={`await secretClient.query.snip20.GetAllowance({
  contract: { address: contractAddress, codeHash: contractCodeHash },
  owner: secretClient.address,
  // spender address, i.e. Bob,
  spender: "${formValueExample({
    formName: 'Get Allowance',
    fieldName: 'allowanceSpender',
    defaultValue: 'secret1fc3fzy78ttp0lwuujw7e52rhspxn8uj52zfyne',
  })}",
  auth: { permit: await getPermit() }
})`}
              inputName='allowanceSpender'
              inputPlaceholder='spender addr'
              refScroll={queryAllowanceRef}
            />
          </section>

          <section>
            <header className='mt-10 mb-4 space-y-1'>
              <em className='font-display text-sm font-medium text-[#FD0F9E]'>Writing data</em>
              <h1 className='font-display text-3xl tracking-tight text-white'>SNIP-20 Transactions</h1>
            </header>
            <Paragraph>Every single transaction has to be signed by to be executed.</Paragraph>
            {secretClient.isReadOnly && (
              <div className='text-white bg-[#FD0F9E]/80 p-5 font-black my-10'>
                <button onClick={secretClient.connectWallet} className='underline underline-offset-4'>
                  Connect wallet
                </button>{' '}
                to interact with transactions
              </div>
            )}
            <Doc
              name='Send'
              secretClient={secretClient}
              onSubmit={handleSend}
              output={sendOutput}
              text={
                <>
                  <Paragraph>
                    Moves amount from the sender account to the recipient account. The receiver account MAY be a
                    contract which got registered with the{' '}
                    <a
                      href='https://github.com/SecretFoundation/SNIPs/blob/master/SNIP-20.md#RegisterReceive'
                      target='_blank'
                      rel='noreferrer'
                    >
                      RegisterReceive
                    </a>{' '}
                    message.
                  </Paragraph>
                </>
              }
              codeBlock={`await secretClient.tx.snip20.send({
  sender: secretClient.address,
  contractAddress: contractAddress,
  codeHash: contractCodeHash,
  msg: {
    send: {
      // recepient address, i.e. Bob,
      recipient: "${formValueExample({
        formName: 'Send',
        fieldName: 'sendRecipient',
        defaultValue: 'secret1fc3fzy78ttp0lwuujw7e52rhspxn8uj52zfyne',
      })}",
      // amount to be sent
      amount: "${formValueExample({
        formName: 'Send',
        fieldName: 'sendAmount',
        defaultValue: '30000000',
      })}",
    },
  }},
  {
  gasLimit: 5_000_000
})`}
              inputName='sendAmount'
              inputPlaceholder='amount'
              inputName2='sendRecipient'
              inputPlaceholder2='recipient'
              refScroll={txSendRef}
            />
            <Doc
              name='Transfer'
              secretClient={secretClient}
              onSubmit={handleTransfer}
              output={transferOutput}
              text={
                <>
                  Moves tokens from the account that appears in the Cosmos message sender field to the account in the
                  recipient field. This is where allowances make sense!
                </>
              }
              codeBlock={`await secretClient.tx.snip20.transfer({
  sender: secretClient.address,
  contractAddress: contractAddress,
  codeHash: contractCodeHash,
  msg: {
    transfer: {
      // recepient address, i.e. Bob,
      recipient: "${formValueExample({
        formName: 'Transfer',
        fieldName: 'transferRecipient',
        defaultValue: 'secret1fc3fzy78ttp0lwuujw7e52rhspxn8uj52zfyne',
      })}",
      // amount to be transferred
      amount: "${formValueExample({
        formName: 'Transfer',
        fieldName: 'transferAmount',
        defaultValue: '30000000',
      })}",
    },
  }},
  {
  gasLimit: 5_000_000
})`}
              inputName='transferAmount'
              inputPlaceholder='amount'
              inputName2='transferRecipient'
              inputPlaceholder2='recipient'
              refScroll={txTransferRef}
            />
            <Doc
              name='Increase Allowance'
              secretClient={secretClient}
              onSubmit={handleIncreaseAllowance}
              output={increaseAllowanceOutput}
              text={
                <>
                  Set or increase the allowance so the spender can access up to{' '}
                  <code>current_allowance + amount tokens</code>
                  from the Cosmos message sender account. This may optionally come with an expiration time, which if set
                  limits when the approval can be used (by time).
                </>
              }
              codeBlock={`await secretClient.tx.snip20.increaseAllowance({
  sender: secretClient.address,
  contractAddress: contractAddress,
  codeHash: contractCodeHash,
  msg: {
    increase_allowance: {
      // spender address, i.e. Bob,
      spender: "${formValueExample({
        formName: 'Increase Allowance',
        fieldName: 'increaseAllowanceSpender',
        defaultValue: 'secret1fc3fzy78ttp0lwuujw7e52rhspxn8uj52zfyne',
      })}",
      // amount to be added to the current allowance
      amount: "${formValueExample({
        formName: 'Increase Allowance',
        fieldName: 'increaseAllowanceAmount',
        defaultValue: '30000000',
      })}",
    },
  }},
  {
  gasLimit: 5_000_000
})`}
              inputName='increaseAllowanceAmount'
              inputPlaceholder='amount'
              inputName2='increaseAllowanceSpender'
              inputPlaceholder2='allowancer addr'
              refScroll={txIncreaseAllowanceRef}
            />
            <Doc
              name='Decrease Allowance'
              secretClient={secretClient}
              onSubmit={handleDecreaseAllowance}
              output={decreaseAllowanceOutput}
              text={<>Decrease or clear the allowance by a sent amount. The message can include an expiration time.</>}
              codeBlock={`await secretClient.tx.snip20.decreaseAllowance({
  sender: secretClient.address,
  contractAddress: contractAddress,
  codeHash: contractCodeHash,
  msg: {
    decrease_allowance: {
      // spender address, i.e. Bob,
      spender: "${formValueExample({
        formName: 'Decrease Allowance',
        fieldName: 'decreaseAllowanceSpender',
        defaultValue: 'secret1fc3fzy78ttp0lwuujw7e52rhspxn8uj52zfyne',
      })}",
      // amount to be subtracted from the current allowance
      amount: "${formValueExample({
        formName: 'Decrease Allowance',
        fieldName: 'decreaseAllowanceAmount',
        defaultValue: '30000000',
      })}",
    },
  }},
  {
  gasLimit: 5_000_000
})`}
              inputName='decreaseAllowanceAmount'
              inputPlaceholder='amount'
              inputName2='decreaseAllowanceSpender'
              inputPlaceholder2='allowancer addr'
              refScroll={txDecreaseAllowanceRef}
            />
          </section>
        </article>
      </div>
    </>
  )
}

function Paragraph(props: PropsWithChildren<unknown>) {
  return <p className='text-slate-400 text-sm my-6 docs-paragraph'>{props.children}</p>
}

export function getStaticProps() {
  return {
    props: createDefaultProps(),
  }
}
