export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value.trim())

export const isPhone = (value: string) => /^(\+?48)?\d{9}$/.test(value.replace(/[\s-]/g, ''))
