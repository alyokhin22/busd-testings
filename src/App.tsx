import {useEffect, useState} from 'react'
import {asyncSleep, nError} from './funcs'
import {useForm} from 'react-hook-form'

export default function App()
{
  // Create variables
  const [chainId, setChainId] = useState<string | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [transactionInfo, setTransactionInfo] = useState<any>(null)

  // Send transaction form
  type TransactionFormEntries = {to: string, amount: string}
  const sendTransactionForm = useForm<TransactionFormEntries>()
  async function onTransactionFormSubmit({to, amount}: TransactionFormEntries)
  {
    try
    {
      const tx = await window.ethereum?.request({method: 'eth_sendTransaction', params: [{
        from: account,
        to,
        value: Number(+amount * 1e18).toString(16),
      }]})

      alert('Заебись. Бабло отправлено. Ожидаем успешность транзакции...')

      do
      {
        await requestBalance()
        await asyncSleep(1000)
      }
      while(await getTxInfo(tx as any) === null)
    }
    catch(error)
    {
      nError(error)
    }
  }

  // Run window.ethereum event handlers
  useEffect(() =>
  {
    if(!window.ethereum)
      return

    // Get chain ID

    window.ethereum.addListener('chainChanged', onChainChange as any)
    window.ethereum.addListener('message', onMessage)

    return () =>
    {
      if(!window.ethereum)
        return

      window.ethereum.removeListener('chainChanged', onChainChange)
      window.ethereum.removeListener('message', onMessage)
    }
  }, [])

  // On chain change
  function onChainChange()
  {
    alert('Сеть изменена. Страница будет перезагружена')
    window.location.reload()
  }

  // On message
  function onMessage(data: any) {
    console.log('New message', data)
    alert('Message: ' + data)
  }

  // Request chain ID function
  function requestChainId() {

    if(!window.ethereum?.networkVersion)
      return alert('Сеть не найдена')

    setChainId(`0x${(+window.ethereum?.networkVersion).toString(16)}`)
  }

  // Request account function
  async function requestAccount()
  {
    try
    {
      if(!window.ethereum)
        return

      // Send request to get account
      const accounts = await window.ethereum.request({method: 'eth_requestAccounts'}) as string[]

      // Set account
      setAccount(accounts[0])
    }
    catch(error)
    {
      nError(error)
    }
  }

  // Request balance function
  async function requestBalance()
  {
    try
    {
      if(!window.ethereum)
        return

      // Send request to get balance
      const balanceInWei = await window.ethereum.request({method: 'eth_getBalance', params: [
        account, 'latest'
      ]}) as string

      // Set balance
      setBalance((+balanceInWei / 10 ** 18).toString())
    }
    catch(error)
    {
      nError(error)
    }
  }

  // Get transaction info function
  async function getTxInfo(tx: string)
  {
    try
    {
      if(!window.ethereum)
        return

      // Send request to get txInfo
      const txInfo = await window.ethereum.request({'method': 'eth_getTransactionReceipt', params: [tx]}) as any

      // Set transaction info
      if(txInfo) setTransactionInfo(txInfo)

      return txInfo
    }
    catch(error)
    {
      nError(error)
    }
  }

  // Render
  return (<>

    {/* Detecting metamask */}
    {window.ethereum && window.ethereum.isMetaMask ? (

      // Metamask detected
      <div>
        <h1>Metamask обнаружен</h1>

        {/* Detecting chain id */}
        {chainId ? (
          <div>
            <h2>Chain ID: (Hex: {chainId}, Dec: {(chainId as any) * 1})</h2>
            <p>По Chain ID будем определять, к какой сети подключился пользователь. 97<sub>10</sub> - тестовая сеть бинанса</p>

            <hr/>

            {/* Detecting account */}
            {account ? (
              <div>
                <p><b>Аккаунт:</b> {account}</p>
                <p>
                  В метамаске похуй, сколько у человека аккаунтов. Скрипт всегда видит только один выбранный аккаунт.
                  В документации метамаска написано, что пока так. Потом, может, поменяют эту штуку
                </p>

                <hr/>

                {/* Detecting balance */}
                {balance !== null ? (
                  <div>
                    <p><b>Баланс:</b> {balance} BNB</p>

                    <hr/>

                    {/* Send money form */}
                    <h2>Отправить бабло</h2>
                    <form onSubmit={sendTransactionForm.handleSubmit(onTransactionFormSubmit)}>
                      <label>
                        Кому: <input type="text" {...sendTransactionForm.register('to', {
                                required: true
                              })} />
                      </label>

                      <br/><br/>

                      <label>
                        Сколько: <input type="text" {...sendTransactionForm.register('amount', {
                                required: true
                              })} />
                      </label>

                      <br/><br/>

                      <button>Отправить нахуй</button>

                      {transactionInfo ? (
                        <div>
                          <hr/>

                          <b>Результат транзакции:</b>

                          <pre>
                            {JSON.stringify(transactionInfo, null, 2)}
                          </pre>

                          <a href={`https://testnet.bscscan.com/tx/${transactionInfo.transactionHash}`} target="_blank">Результат на тестнете</a>
                        </div>
                      ) : null}
                    </form>
                  </div>
                ) : (
                  <div>
                    <button onClick={() => requestBalance()}>Запросить баланс</button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <button onClick={() => requestAccount()}>Получить аккаунт</button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <button
              onClick={() => requestChainId()}
            >
              Подключиться к Metamask
            </button>
          </div>
        )}
      </div>
    ) : (

      // Metamask not detected
      <div>
        <h1>Metamask не обнаружен!</h1>

        <a href={`https://metamask.app.link/dapp/${window.location.host}`}>
          <button>Подключить</button>
        </a>
      </div>
    )}
  </>)
}
