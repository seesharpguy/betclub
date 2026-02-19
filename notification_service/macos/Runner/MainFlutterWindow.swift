import Cocoa
import FlutterMacOS

class MainFlutterWindow: NSWindow {
  override func awakeFromNib() {
    let flutterViewController = FlutterViewController()
    self.contentViewController = flutterViewController

    // Hide the window — this is a menu bar-only app
    self.setFrame(NSRect(x: 0, y: 0, width: 0, height: 0), display: false)
    self.styleMask.remove(.titled)
    self.styleMask.remove(.closable)
    self.styleMask.remove(.miniaturizable)
    self.styleMask.remove(.resizable)
    self.isReleasedWhenClosed = false

    RegisterGeneratedPlugins(registry: flutterViewController)

    super.awakeFromNib()

    self.orderOut(nil)
  }
}
