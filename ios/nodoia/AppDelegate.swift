import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    FirebaseApp.configure()

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "nodoia",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // MARK: - Universal Links Support
  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
          let incomingURL = userActivity.webpageURL else {
      return false
    }

    // Handle the Universal Link
    return handleUniversalLink(url: incomingURL)
  }

  private func handleUniversalLink(url: URL) -> Bool {
    // Parse the URL to extract merchant ID
    // Expected format: https://nodo.ia/m/merchant/{id}
    let pathComponents = url.pathComponents
    
    guard pathComponents.count >= 3,
          pathComponents[1] == "m",
          pathComponents[2] == "merchant",
          let merchantId = pathComponents.count > 3 ? pathComponents[3] : nil else {
      return false
    }

    // Post notification to React Native to handle the deep link
    NotificationCenter.default.post(
      name: NSNotification.Name("UniversalLinkReceived"),
      object: nil,
      userInfo: ["url": url.absoluteString, "merchantId": merchantId]
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
