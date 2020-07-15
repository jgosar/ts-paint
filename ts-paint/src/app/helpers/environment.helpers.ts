const OS_VERSTION_USER_AGENTS: { osName: string; userAgentRegex: RegExp }[] = [
  { osName: 'Windows 10', userAgentRegex: /(Windows 10.0|Windows NT 10.0)/ },
  { osName: 'Windows 8.1', userAgentRegex: /(Windows 8.1|Windows NT 6.3)/ },
  { osName: 'Windows 8', userAgentRegex: /(Windows 8|Windows NT 6.2)/ },
  { osName: 'Windows 7', userAgentRegex: /(Windows 7|Windows NT 6.1)/ },
  { osName: 'Windows Vista', userAgentRegex: /Windows NT 6.0/ },
  { osName: 'Windows Server 2003', userAgentRegex: /Windows NT 5.2/ },
  { osName: 'Windows XP', userAgentRegex: /(Windows NT 5.1|Windows XP)/ },
  { osName: 'Windows 2000', userAgentRegex: /(Windows NT 5.0|Windows 2000)/ },
  { osName: 'Windows ME', userAgentRegex: /(Win 9x 4.90|Windows ME)/ },
  { osName: 'Windows 98', userAgentRegex: /(Windows 98|Win98)/ },
  { osName: 'Windows 95', userAgentRegex: /(Windows 95|Win95|Windows_95)/ },
  { osName: 'Windows NT 4.0', userAgentRegex: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/ },
  { osName: 'Windows CE', userAgentRegex: /Windows CE/ },
  { osName: 'Windows 3.11', userAgentRegex: /Win16/ },
  { osName: 'Android', userAgentRegex: /Android/ },
  { osName: 'Open BSD', userAgentRegex: /OpenBSD/ },
  { osName: 'Sun OS', userAgentRegex: /SunOS/ },
  { osName: 'Chrome OS', userAgentRegex: /CrOS/ },
  { osName: 'Linux', userAgentRegex: /(Linux|X11(?!.*CrOS))/ },
  { osName: 'iOS', userAgentRegex: /(iPhone|iPad|iPod)/ },
  { osName: 'Mac OS X', userAgentRegex: /Mac OS X/ },
  { osName: 'Mac OS', userAgentRegex: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/ },
  { osName: 'QNX', userAgentRegex: /QNX/ },
  { osName: 'UNIX', userAgentRegex: /UNIX/ },
  { osName: 'BeOS', userAgentRegex: /BeOS/ },
  { osName: 'OS/2', userAgentRegex: /OS\/2/ },
  {
    osName: 'Search Bot',
    userAgentRegex: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/,
  },
];

export function getOsVersion(): string {
  return OS_VERSTION_USER_AGENTS.find((x) => x.userAgentRegex.test(window.navigator.userAgent))?.osName;
}
