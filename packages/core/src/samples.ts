export interface SampleLog {
  id: string;
  name: string;
  suggestedPattern: string;
  lines: string[];
}

export const sampleLogs: SampleLog[] = [
  {
    id: "nginx",
    name: "Nginx access log",
    suggestedPattern: "%{NGINXACCESS}",
    lines: [
      '192.168.1.10 - - [10/Oct/2023:13:55:36 +0000] "GET /index.html HTTP/1.1" 200 612 "-" "Mozilla/5.0"',
      '10.0.0.5 - admin [10/Oct/2023:13:56:01 +0000] "POST /api/login HTTP/1.1" 401 128 "-" "curl/7.88"',
    ],
  },
  {
    id: "syslog",
    name: "Syslog",
    suggestedPattern: "%{SYSLOGLINE}",
    lines: [
      "Oct 10 13:55:36 server01 sshd[12345]: Accepted publickey for deploy from 10.0.0.1 port 22",
      "Oct 10 13:56:01 server01 kernel: USB disconnect, device number 2",
    ],
  },
  {
    id: "apache",
    name: "Apache combined",
    suggestedPattern: "%{COMBINEDAPACHELOG}",
    lines: [
      '127.0.0.1 - frank [10/Oct/2023:13:55:36 +0000] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://example.com/" "Mozilla/4.0"',
    ],
  },
  {
    id: "java",
    name: "Java stack trace",
    suggestedPattern: "%{GREEDYDATA:message}",
    lines: [
      "Exception in thread \"main\" java.lang.NullPointerException",
      "    at com.example.App.main(App.java:42)",
    ],
  },
  {
    id: "cloudtrail",
    name: "CloudTrail (JSON)",
    suggestedPattern: '%{TIMESTAMP_ISO8601:eventTime}',
    lines: [
      '{"eventTime":"2023-10-10T13:55:36Z","eventName":"ConsoleLogin","userIdentity":{"type":"IAMUser"}}',
    ],
  },
];
