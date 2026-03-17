package com.networktools

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import java.util.HashMap

class NetworkToolsPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return when (name) {
      NetworkToolsModule.NAME -> NetworkToolsModule(reactContext)
      NetworkToolsLegacyModule.NAME -> NetworkToolsLegacyModule(reactContext)
      else -> null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()
      moduleInfos[NetworkToolsModule.NAME] = ReactModuleInfo(
        NetworkToolsModule.NAME,
        NetworkToolsModule.NAME,
        false,  // canOverrideExistingModule
        false,  // needsEagerInit
        false,  // isCxxModule
        true // isTurboModule
      )
      moduleInfos[NetworkToolsLegacyModule.NAME] = ReactModuleInfo(
        NetworkToolsLegacyModule.NAME,
        NetworkToolsLegacyModule.NAME,
        false,  // canOverrideExistingModule
        false,  // needsEagerInit
        false,  // isCxxModule
        false // isTurboModule
      )
      moduleInfos
    }
  }
}
