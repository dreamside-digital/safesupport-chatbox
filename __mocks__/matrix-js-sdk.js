export const mockCreateClient = jest.fn();
export const mockStartClient = jest.fn();

const mockMatrix = jest.fn().mockImplementation(() => {
  return {
    createClient: mockCreateClient,
    startClient: mockStartClient
  };
});

export default mockMatrix;