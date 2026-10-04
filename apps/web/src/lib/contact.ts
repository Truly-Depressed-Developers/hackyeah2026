export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value.trim())

export const isPhone = (value: string) => /^(\+?48)?\d{9}$/.test(value.replace(/[\s-]/g, ''))

/** The Mieszkaniec consents by submitting the form, so consent is given at the moment of sending. */
export const consentGivenNow = () => new Date()
