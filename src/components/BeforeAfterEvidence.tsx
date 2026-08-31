import { CalendarDays, MapPinned, MonitorPlay, Satellite } from "lucide-react";

export default function BeforeAfterEvidence() {
  return <section className="comparison-view" data-testid="before-after-evidence">
    <video className="comparison-video" controls playsInline preload="metadata" poster="/media/rasuwa-sentinel2-poster.jpg">
      <source src="/media/rasuwa-sentinel2-before-after.mp4" type="video/mp4" />
      Your browser does not support embedded video.
    </video>
    <div className="comparison-gradient" />
    <header className="comparison-title"><span>Satellite change evidence</span><h1>Rasuwa before &amp; after the flood</h1><p>QGIS layer-swipe recording using Sentinel-2 imagery</p></header>
    <aside className="comparison-meta glass-panel">
      <div><Satellite size={17} /><span><small>Imagery</small><strong>Sentinel-2</strong></span></div>
      <div><CalendarDays size={17} /><span><small>Before acquisition</small><strong>24 August 2026</strong></span></div>
      <div><CalendarDays size={17} /><span><small>After acquisition</small><strong>27 August 2026</strong></span></div>
      <div><MapPinned size={17} /><span><small>Study area</small><strong>Rasuwa, Nepal</strong></span></div>
      <div><MonitorPlay size={17} /><span><small>Processing</small><strong>QGIS · Layer Swipe</strong></span></div>
    </aside>
    <p className="comparison-note">Visual comparison only. Apparent differences may also reflect cloud, shadow, atmospheric conditions, alignment, or processing—not only flood damage.</p>
  </section>;
}
