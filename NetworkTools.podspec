require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "NetworkTools"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/imsankalp/react-native-network-tools.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,cpp}"

  # NetworkToolsManager.h is public so Swift AppDelegates can call
  # [NetworkToolsManager activate] after `import NetworkTools`.
  s.public_header_files = "ios/NetworkToolsManager.h"

  # DEFINES_MODULE = YES tells CocoaPods to generate an umbrella header +
  # module map for this pod and inject -fmodule-map-file into every dependent
  # target's xcconfig, which is what makes `import NetworkTools` work in Swift
  # without use_frameworks!. (Same mechanism used by RNReanimated et al.)
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }

  install_modules_dependencies(s)
end
