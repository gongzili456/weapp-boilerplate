import Session from './session'

export default {
  config (p) {
    console.log('config => ', p)
    p = typeof p === 'string' ? {
      url: p,
      method: 'GET'
    } : p

    const session = Session.get()

    return Object.assign({}, p, {
      url: handleUrl(p.url),
      header: Object.assign({}, p.header, { token: session ? session.token : undefined })
    })
  },
  success (p) {
    console.log('success => ', p)
    if (p.statusCode === 401) {
      // TODO handle 401
      throw new Error('access 401')
    }
    return p
  },
  fail (p) {
    console.log('fail => ', p)
    return p
  }
}

function handleUrl(url) {
  // return `https://wecms.10funds.com/api${url}`
  // return `http://localhost:8001/api${url}`
  return `https://matong.io/api${url}`
}
