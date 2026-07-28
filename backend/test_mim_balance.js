const axios = require('axios');

async function testBalance() {
  const payload = {
    UserName: 'naimprince010@gmail.com',
    Apikey: 'HGY5QT4ZRSDZ2XAODOZ0PXLEJ'
  };

  try {
    const res = await axios.post('https://api.mimsms.com/api/V2/BalanceCheck', payload);
    console.log('Success POST:', res.data);
  } catch (error) {
    console.log('Error POST:', error.response ? error.response.data : error.message);
  }

  try {
    const res2 = await axios.get(`https://api.mimsms.com/api/V2/BalanceCheck?ApiKey=${payload.Apikey}`);
    console.log('Success GET:', res2.data);
  } catch (error) {
    console.log('Error GET:', error.response ? error.response.data : error.message);
  }
  try {
    const res2 = await axios.get(`https://api.mimsms.com/api/SmsSending/SMSBalance?UserName=${payload.UserName}&Apikey=${payload.Apikey}`);
    console.log('Success GET:', res2.data);
  } catch (error) {
    console.log('Error GET:', error.response ? error.response.data : error.message);
  }
}

testBalance();
