import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));

if (environment.stageName === 'local' || environment.stageName === 'dev') {
  const fps = document.getElementById('fps') as HTMLElement;
  let startTime = Date.now();
  let frame = 0;

  function tick() {
    const time = Date.now();
    frame++;
    if (time - startTime > 1000) {
      fps.innerHTML = (frame / ((time - startTime) / 1000)).toFixed(1);
      startTime = time;
      frame = 0;
    }
    window.requestAnimationFrame(tick);
  }
  tick();
}
