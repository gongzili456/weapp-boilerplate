import wepy from 'wepy'
import constants from './constants'
import Session from './session'

/***
 * @class
 * 表示登录过程中发生的异常
 */
const LoginError = (function () {
  function LoginError(type, message) {
    Error.call(this, message)
    this.type = type
    this.message = message
  }

  LoginError.prototype = new Error()
  LoginError.prototype.constructor = LoginError

  return LoginError
})()

/**
* 微信登录，获取 code 和 encryptData
*/
async function getWxLoginResult() {
  let loginResult

  try {
    loginResult = await wepy.login()
  } catch (loginError) {
    const error = new LoginError(constants.ERR_WX_LOGIN_FAILED, '微信登录失败，请检查网络状态')
    error.detail = loginError
    throw error
  }

  try {
    const userResult = await wepy.getUserInfo()
    return {
      code: loginResult.code,
      encryptedData: userResult.encryptedData,
      iv: userResult.iv,
      userInfo: userResult.userInfo
    }
  } catch (userError) {
    const error = new LoginError(constants.ERR_WX_GET_USER_INFO, '获取微信用户信息失败，请检查网络状态')
    error.detail = userError
    throw error
  }
}

async function doLogin() {
  const wxLoginResult = await getWxLoginResult()

  const userInfo = wxLoginResult.userInfo

  const code = wxLoginResult.code
  const encryptedData = wxLoginResult.encryptedData
  const iv = wxLoginResult.iv
  const header = {}

  header[constants.WX_HEADER_CODE] = code
  header[constants.WX_HEADER_ENCRYPTED_DATA] = encryptedData
  header[constants.WX_HEADER_IV] = iv

  let result
  try {
    result = await wepy.request({
      url: '/v1/signinv2',
      skipAuth: true,
      header: header,
      method: 'POST'
    })
  } catch (e) {
    const error = new LoginError(constants.ERR_LOGIN_FAILED, '登录失败，可能是网络错误或者服务器发生异常')
    error.detail = e
    throw error
  }

  const data = result.data
  // TODO 处理错误情况
  if (data.error) {
    const errorMessage = '登录失败(' + data.error + ')：' + (data.message || '未知错误')
    const noSessionError = new LoginError(constants.ERR_LOGIN_SESSION_NOT_RECEIVED, errorMessage)
    throw noSessionError
  }
  // 保存 session
  Session.set({
    token: data.token,
    user: data.user
  })
}

export default async () => {
  const session = Session.get()

  if (!session) {
    return doLogin()
  }

  try {
    await wepy.checkSession()
    return session
  } catch (e) {
    Session.clear()
    doLogin()
  }
}
