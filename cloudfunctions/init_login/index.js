// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  // 查询user表内 是否存在该用户信息
  db.collection('user').where({
    _openid: wxContext.OPENID
  }).get()
  .then(res => {
    if (!res.data.length) {
      // 如果用户信息不存在 把信息写入表中
      db.collection('user').add({
        data: {
          '_openid': wxContext.OPENID,
          'create_time': db.serverDate()
        }
      })
      return {
        data: {
          ret: 'OK',
          msg: '新增用户成功'
        }
      }
    } else {
      // 如果信息存在 手机号码也验证通过 绑定到openid 上
      let tel = event.tel;
      if (!(/^1[3456789]\d{9}$/.test(tel))) {
        return {
          data: {
            ret: 'ERROR',
            msg: '手机格式错误'
          }
        }
      }
      // 绑定手机号与openid
      db.collection('user')
      .where({
        _openid: wxContext.OPENID
      })
      .update({
        data: {
          tel
        },
      })
    }
  })
  .catch(error => {
    console.error(error);
  })

  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}
