import constants from './constants'
import wepy from 'wepy'

const SESSION_KEY = `weapp_session_${constants.WX_SESSION_MAGIC_ID}`

const get = function () {
  return wepy.getStorageSync(SESSION_KEY) || null
}

const set = function (session) {
  wepy.setStorageSync(SESSION_KEY, session)
}

const clear = function () {
  wepy.removeStorageSync(SESSION_KEY)
}

export default {
  get,
  set,
  clear
}
