# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ============================================================================
# REACT NATIVE CORE
# ============================================================================
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip

-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
}

# ============================================================================
# APPLICATION & BRIDGE CLASSES
# ============================================================================
-keep class com.nodoia.nodo.MainApplication { *; }
-keep class com.nodoia.nodo.MainActivity { *; }

# React Native Bridge & JSI/TurboModules
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.turbomodule.core.interfaces.** { *; }

# Native modules implementation
-keepnames class * implements com.facebook.react.bridge.NativeModule
-keepclassmembers class * implements com.facebook.react.bridge.NativeModule {
    public <methods>;
}
-keepclasseswithmembernames class * {
    native <methods>;
}

# ============================================================================
# CONFIG & BUILD
# ============================================================================
-keep class com.lugg.ReactNativeConfig.** { *; }
-keep class com.nodoia.nodo.BuildConfig { *; }
-keepclassmembers class com.nodoia.nodo.BuildConfig {
    public static <fields>;
}

# ============================================================================
# APOLLO GRAPHQL
# ============================================================================
-keep class com.apollographql.** { *; }
-keep class apollo.** { *; }
-keepclassmembers class * {
    @com.apollographql.apollo3.annotations.** <fields>;
}

# ============================================================================
# GOOGLE SERVICES & AUTHENTICATION
# ============================================================================
-keep class com.google.android.gms.** { *; }
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.common.** { *; }
-keep class com.google.android.gms.signin.** { *; }
-keep class com.google.android.gms.tasks.** { *; }
-keep class com.google.android.gms.base.** { *; }
-keep class com.google.android.gms.maps.** { *; }
-dontwarn com.google.android.gms.**
-dontwarn com.google.firebase.**

# Keep Google Sign-In native modules
-keep class co.apptailor.googlesignin.** { *; }
-keep class com.reactnativegooglesignin.** { *; }

# Apple Authentication
-keep class com.invertase.react.** { *; }

# ============================================================================
# UI LIBRARIES
# ============================================================================
# React Navigation
-keep class com.reactnavigation.** { *; }
-dontwarn com.reactnavigation.**

# Maps
-keep class com.airbnb.android.react.maps.** { *; }

# Animations & Gestures
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }

# Linear Gradient
-keep class com.BV.LinearGradient.** { *; }

# Bottom Sheet
-keep class com.gorhom.bottomsheet.** { *; }

# Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# ============================================================================
# IMAGE & MEDIA LIBRARIES
# ============================================================================
# Fast Image
-keep class com.dylanvann.fastimage.** { *; }

# Image Cropping & Processing
-keep class com.yalantis.ucrop.** { *; }
-keep class com.bumptech.glide.** { *; }
-dontwarn com.bumptech.glide.**

# Camera Roll
-keep class com.react.native.camera.roll.** { *; }

# ============================================================================
# STORAGE & STATE MANAGEMENT
# ============================================================================
# MMKV Storage
-keep class com.tencent.mmkv.** { *; }

# Zustand
-keep interface zustand.** { *; }

# ============================================================================
# NETWORKING
# ============================================================================
# OkHttp & Axios
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-keep class io.github.cymchad.okhttp.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# ============================================================================
# BILLING & MONETIZATION
# ============================================================================
-keep class com.android.billingclient.** { *; }
-keep class com.android.vending.billing.** { *; }

# ============================================================================
# OTHER LIBRARIES
# ============================================================================
# Keyboard Controller
-keep class com.reactnative.keyboard.** { *; }

# Haptic Feedback
-keep class com.reactnativehapticfeedback.** { *; }

# Audio Recorder
-keep class com.umeng.analytics.** { *; }

# WebView
-keep class org.chromium.** { *; }
-dontwarn org.chromium.**

# Nitro Modules
-keep class com.mrousavy.nitro.** { *; }
-keep class com.mrousavy.** { *; }

# Keep HybridAudioRecorderPlayer for Nitro audio module
-keep class com.margelo.nitro.audiorecorderplayer.** { *; }
-keep class com.margelo.nitro.audiorecorderplayer.HybridAudioRecorderPlayer { *; }

# ============================================================================
# GENERIC RULES
# ============================================================================
# JavaScript Interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Serialization
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Crashlytics (if used)
-keep class com.crashlytics.** { *; }
-dontwarn com.crashlytics.**

# ============================================================================
# OPTIMIZATION & DEBUGGING
# ============================================================================
# Remove debug logs in release builds
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Remove React Native dev tools
-assumenosideeffects class com.facebook.react.bridge.ReactMarker {
    public static *** logMarker(...);
}

# Preserve line numbers for better crash reports
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable