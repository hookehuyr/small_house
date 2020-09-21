// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
/**
 * event 结构
 * {
   "FromUserName": "ohl4L0Rnhq7vmmbT_DaNQa4ePaz0",
   "ToUserName": "wx3d289323f5900f8e",
   "Content": "测试",
   "CreateTime": 1555684067,
   "MsgId": "49d72d67b16d115e7935ac386f2f0fa41535298877_1555684067",
   "MsgType": "text"
 }
*/
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  if (event.Content == '1' || event.Content == '购买') {
    await cloud.openapi.customerServiceMessage.send({
      touser: wxContext.OPENID,
      msgtype: 'link',
      link: {
        title: '课程名称',
        description: '课程描述',
        url: 'http://xxx.com/xxx'
      }
    });
  } else {
    await cloud.openapi.customerServiceMessage.send({
      touser: wxContext.OPENID,
      msgtype: 'text',
      text: {
        content: '您好,很高兴为您服务。回复1:购买课程'
      }
    });
  }

  return 'success';
};
