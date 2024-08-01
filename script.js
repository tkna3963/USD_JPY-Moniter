const ws_url = 'wss://forex-api.coin.z.com/ws/public/v1';
const ctx = document.getElementById('chart').getContext('2d');

const askList = [];
const bidList = [];
const timeList = [];

const chart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [
            {
                label: 'Ask',
                borderColor: 'blue',
                backgroundColor: 'rgba(0,0,255,0.1)',
                data: []
            },
            {
                label: 'Bid',
                borderColor: 'red',
                backgroundColor: 'rgba(255,0,0,0.1)',
                data: []
            }
        ]
    },
    options: {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'minute',
                    displayFormats: {
                        minute: 'HH:mm:ss'
                    }
                }
            },
            y: {
                beginAtZero: false
            }
        }
    }
});

const ws = new WebSocket(ws_url);

ws.onopen = () => {
    ws.send(JSON.stringify({ command: 'subscribe', channel: 'ticker', symbol: 'USD_JPY' }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const { symbol, ask, bid, timestamp, status } = data;

    const timestampDate = new Date(timestamp);
    const formattedTimestamp = `取得時刻: ${timestampDate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`;
    if (timeList.length > 100) {
        askList.shift(); 
        bidList.shift(); 
        timeList.shift();
    }
    if (askList.length > 0) {
        const prevAsk = askList[askList.length - 1].y;
        const prevBid = bidList[bidList.length - 1].y;
        updateLabels(ask, bid, prevAsk, prevBid, formattedTimestamp);
    } else {
        updateLabels(ask, bid, null, null, formattedTimestamp);
    }

    askList.push({ x: timestampDate, y: ask });
    bidList.push({ x: timestampDate, y: bid });
    timeList.push(timestampDate);

    updateChart();
    updateMessageText(event.data);
    updateTransactionInfo(status);
};

function updateLabels(ask, bid, prevAsk = null, prevBid = null, formattedTimestamp) {
    document.getElementById('ask-label').innerHTML = `買値 (Ask): ${ask}円`;
    document.getElementById('bid-label').innerHTML = `売値 (Bid): ${bid}円`;
    document.getElementById('timestamp-label').innerHTML = formattedTimestamp;
}

function updateChart() {
    chart.data.datasets[0].data = askList;
    chart.data.datasets[1].data = bidList;
    chart.update();
}

function updateMessageText(message) {
    const messageText = document.getElementById('message-text');
    messageText.value += `${message}\n`;
    messageText.scrollTop = messageText.scrollHeight;
}

function updateTransactionInfo(status) {
    const transactionInfo = document.getElementById('transaction-info');
    transactionInfo.innerText = status === 'OPEN' ? '取引中' : (status === 'CLOSE' ? '休日' : '不明');
}
