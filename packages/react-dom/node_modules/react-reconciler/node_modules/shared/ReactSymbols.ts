// 为了防止 ReactElement 被滥用，将 ReactElement 定义为唯一值

// 判断当前宿主环境是否支持 Symbol
const supportSymbol = typeof Symbol === 'function' && Symbol.for;

export const REACT_ELEMENT_TYPE = supportSymbol ? Symbol.for('react.element') : 0xeac7;
