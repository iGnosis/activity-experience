import { Component } from '@angular/core';
import { QaService } from './services/qa/qa.service';
import { SocketService } from './services/socket/socket.service';
import { ThemeService } from './services/theme/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'activities';
  constructor(
    private themeService: ThemeService,
    private qaService: QaService,
    private socketService: SocketService,
  ) {
    this.themeService.setTheme();
    this.qaService.init();
    this.overrideConsole();
  }

  overrideConsole() {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    console.log = (...args) => {
      this.socketService.sendLogsToServer(
        (JSON.stringify(args).toLowerCase().includes('error') ? '[ERROR] ' : '[LOG] ') +
          JSON.stringify(args),
      );
      originalConsoleLog.apply(console, args);
    };
    console.error = (...args) => {
      this.socketService.sendLogsToServer(
        '[ERROR] ' + JSON.stringify(args, Object.getOwnPropertyNames(args)),
      );
      originalConsoleError.apply(console, args);
    };
    console.warn = (...args) => {
      this.socketService.sendLogsToServer('[WARN] ' + JSON.stringify(args));
      originalConsoleWarn.apply(console, args);
    };
  }
}
