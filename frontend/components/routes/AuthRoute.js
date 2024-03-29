import { useEffect, useState, useContext } from "react"
import axios from "axios"
import { useRouter } from "next/router"
import { SyncOutlined } from "@ant-design/icons"
import { UserContext } from "../../context"

const UserRoute = ({ children }) => {
  const [ok, setOk] = useState(false)
  const router = useRouter()
  const [state] = useContext(UserContext)

  useEffect(() => {
    if (state && state.token) getCurrentUser()
  }, [state && state.token])

  //check if user is authorized or not
  const getCurrentUser = async () => {
    try {
     await axios.get('auth/current-user')
      setOk(true)
    } catch (err) {
      router.push("/Login")
    }
  }
//if no token, user gets redirected to login page
  process.browser &&
    state === null &&
    setTimeout(() => {
      getCurrentUser()
    }, 1000)

  return !ok ? (
    <SyncOutlined
      spin
      className="d-flex justify-content-center display-1 text-primary p-5"
    />
  ) : (
    <> {children}</>
  )
}

export default UserRoute