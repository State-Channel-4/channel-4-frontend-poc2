"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import Channel4Icon from "@/assets/channel-4-icon-v2.svg"
import { useJwtStore } from "@/store/jwt"
import { Web3Auth } from "@web3auth/modal"
import { BrowserProvider, Eip1193Provider, JsonRpcSigner } from "ethers"

type SocialLogin = {
  email: string
  provider: string
}

type AuthContextType = {
  initializingW3A: boolean
  socialLogin: SocialLogin | null
  signer: JsonRpcSigner | null
  signIn: () => void
  signedIn: boolean
  signOut: () => void
}

const AuthContext = createContext<AuthContextType>({
  initializingW3A: false,
  socialLogin: null,
  signer: null,
  signIn: () => undefined,
  signedIn: false,
  signOut: () => undefined,
})

export const AuthProvider: React.FC<{ children: JSX.Element }> = ({
  children,
}) => {
  const [socialLogin, setSocialLogin] = useState<SocialLogin | null>(null)
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [web3Auth, setWeb3Auth] = useState<Web3Auth | null>(null)
  const { token, userId, updateToken, updateUserId } = useJwtStore()

  const connectWeb3Auth = async () => {
    // If web3auth has not been initialized correctly then call init modal
    if (web3Auth?.status === "not_ready") {
      await web3Auth?.initModal()
    }
    if (web3Auth?.status === "errored" || web3Auth?.status === "not_ready") {
      alert(
        "Web3Auth is not initialized. Please click sign-in again. If the issue persists refresh the page and try again."
      )
    } else {
      return await web3Auth?.connect()
    }
  }

  const getSigner = async (web3AuthProvider: Eip1193Provider) => {
    const provider = new BrowserProvider(web3AuthProvider)
    return await provider.getSigner()
  }

  const getProviderInfo = async (w3a: Web3Auth | null) => {
    if (!w3a) return
    const info = await w3a.getUserInfo()
    if ("typeOfLogin" in info) {
      setSocialLogin({
        email: info.email ?? "",
        provider: info.typeOfLogin ?? "",
      })
    }
  }

  const signIn = async () => {
    try {
      const web3AuthProvider = await connectWeb3Auth()
      if (web3AuthProvider) {
        // Create ethers provider from web3 auth provider
        const rpcSigner = await getSigner(web3AuthProvider)
        const signedMessage = await rpcSigner.signMessage(
          process.env.NEXT_PUBLIC_API_LOGIN_SECRET!
        )
        // TODO: Place inside a server utils folder?
        // Login on the server
        const { user, token, message } = await fetch(
          process.env.NEXT_PUBLIC_API_URL + "/login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ signedMessage }),
          }
        ).then((response) => response.json())
        // handle any server error messages
        if (message) throw new Error(message)
        await getProviderInfo(web3Auth)
        updateToken(token)
        updateUserId(user._id)
        setSigner(rpcSigner)
      }
    } catch (err) {
      // TODO: Add toast notifications to display errors?
      console.log("Error occured signing in: ", err)
    }
  }

  const signOut = async () => {
    await web3Auth?.logout()
    updateToken(null)
    updateUserId(null)
    setSigner(null)
    // Reload window to avoid Web3Auth disconnect / reconnect bug
    window.location.reload()
  }

  const signedIn = useMemo(() => {
    return !!signer && !!token && !!userId
  }, [signer, token, userId])

  useEffect(() => {
    const init = async () => {
      const client = new Web3Auth({
        clientId: process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID ?? "",
        web3AuthNetwork: "sapphire_devnet", // Web3Auth Network
        chainConfig: {
          chainNamespace: "eip155",
          chainId: "0xaa36a7",
          rpcTarget: "https://rpc.ankr.com/eth_sepolia",
          displayName: "Ethereum Sepolia",
          blockExplorer: "https://sepolia.etherscan.io",
          ticker: "ETH",
          tickerName: "Ethereum",
        },
        uiConfig: {
          appName: "Channel 4",
          loginMethodsOrder: ["google", "discord", "facebook", "reddit"],
          logoDark: Channel4Icon.src,
          logoLight: Channel4Icon.src,
          theme: {
            primary: "#50C440",
          },
        },
      })
      await client.initModal()
      setWeb3Auth(client)
      // Check if web3 is connected and if so extract signer
      if (client.status === "connected" && client.provider) {
        const rpcSigner = await getSigner(client.provider)
        setSigner(rpcSigner)
        await getProviderInfo(client)
      }
    }
    init()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        initializingW3A: !web3Auth,
        socialLogin,
        signer,
        signIn,
        signedIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => useContext(AuthContext)
