# KS X 4506 Parser

This library is a parser for the [KS X 4506](https://standard.go.kr/KSCI/ksNotification/getKsNotificationView.do?ntfcManageNo=2016-00079&menuId=921&topMenuId=502) which is a standard in South Korea for devices used in smart home environments that usually communicates via the RS485 interface.

## Installation

```
yarn add ksx4506
```

## Code Example

```typescript
const port = new SerialPort("/dev/tty.usbserial-AQ00WHW9", {
    baudRate: 9600,
    dataBits: 8,
    parity: "none",
    stopBits: 1,
    autoOpen: true
})
port.pipe(parser)
parser.on("data", (dataframe: DataFrame) => {
    console.log(dataframe)
})
```
