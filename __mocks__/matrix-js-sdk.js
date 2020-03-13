export const mockRegisterRequest = jest
  .fn()
  .mockImplementation((params) => {
    if (!params.auth) {
      return Promise.reject({
        data: { session: "session_id_1234" }
      })
    } else {
      return Promise.resolve({
        data: {
          device_id: 'device_id_1234',
          access_token: 'token_1234',
          user_id: 'user_id_1234',
          session: "session_id_1234"
        }
      })
    }
  })

export const mockLeave = jest.fn(() => {
  return Promise.resolve('value');
});
export const mockInitCrypto = jest.fn()
export const mockStartClient = jest.fn(() => {
  return Promise.resolve('value');
});
export const mockOnce = jest.fn()
export const mockStopClient = jest.fn(() => {
  return Promise.resolve('value');
});
export const mockClearStores = jest.fn(() => {
  return Promise.resolve('value');
});
export const mockGetRoom = jest.fn()
export const mockDownloadKeys = jest.fn()
export const mockSetDeviceVerified = jest.fn()
export const mockIsCryptoEnabled = jest.fn()
export const mockCreateRoom = jest.fn().mockReturnValue({ room_id: 'room_id_1234' })
export const mockSetPowerLevel = jest.fn()
export const mockSendTextMessage = jest.fn(() => {
  return Promise.resolve('value');
});
export const mockSetDeviceKnown = jest.fn()
export const mockDeactivateAccount = jest.fn(() => {
  return Promise.resolve('value');
});
export const mockOn = jest.fn()

export const mockClient = {
  registerRequest: mockRegisterRequest,
  initCrypto: mockInitCrypto,
  startClient: mockStartClient,
  on: mockOn,
  once: mockOnce,
  leave: mockLeave,
  stopClient: mockStopClient,
  clearStores: mockClearStores,
  getRoom: mockGetRoom,
  downloadKeys: mockDownloadKeys,
  setDeviceVerified: mockSetDeviceVerified,
  setDeviceKnown: mockSetDeviceKnown,
  isCryptoEnabled: mockIsCryptoEnabled,
  createRoom: mockCreateRoom,
  setPowerLevel: mockSetPowerLevel,
  sendTextMessage: mockSendTextMessage,
  deactivateAccount: mockDeactivateAccount,
}

export const createClient = jest.fn().mockReturnValue(mockClient)
