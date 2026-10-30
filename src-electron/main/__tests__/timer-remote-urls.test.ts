import { describe, expect, it, vi } from 'vitest';

const { networkInterfacesMock } = vi.hoisted(() => ({
  networkInterfacesMock: vi.fn(),
}));

vi.mock('node:os', () => ({ networkInterfaces: networkInterfacesMock }));

vi.mock('src-electron/main/utils', () => ({ captureElectronError: vi.fn() }));

const { getTimerRemoteUrls } = await import('../timer-remote');

const adapter = (address: string, options: { internal?: boolean } = {}) => ({
  address,
  family: 'IPv4',
  internal: options.internal ?? false,
});

describe('timer remote addresses', () => {
  it('leads with home networks and skips addresses a tablet cannot reach', () => {
    networkInterfacesMock.mockReturnValue({
      'Ethernet 2': [adapter('169.254.2.3')],
      ipv6: [{ address: 'fe80::1', family: 'IPv6', internal: false }],
      loopback: [adapter('127.0.0.1', { internal: true })],
      // Virtual adapters tend to come first in the OS list, which would put
      // an unreachable address in front of the real Wi-Fi one.
      'vEthernet (WSL)': [adapter('172.30.1.5')],
      VPN: [adapter('10.8.0.2')],
      'Wi-Fi': [adapter('192.168.1.20')],
    });

    expect(getTimerRemoteUrls(8787)).toEqual([
      'http://192.168.1.20:8787/',
      'http://10.8.0.2:8787/',
      'http://172.30.1.5:8787/',
    ]);
  });

  it('keeps public addresses last and removes duplicates', () => {
    networkInterfacesMock.mockReturnValue({
      first: [adapter('203.0.113.5'), adapter('192.168.1.20')],
      second: [adapter('192.168.1.20')],
    });

    expect(getTimerRemoteUrls(8080)).toEqual([
      'http://192.168.1.20:8080/',
      'http://203.0.113.5:8080/',
    ]);
  });
});
