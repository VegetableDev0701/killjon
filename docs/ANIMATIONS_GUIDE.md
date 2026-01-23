# NODO.ia Smooth Animations Guide

## Overview

This guide covers the Any.do-inspired smooth transitions and micro-animations implemented throughout the NODO.ia app. The animation system provides:

- **Smooth page transitions** with cross-fade and slide effects
- **Modal animations** with Any.do-style bottom sheet slides
- **Micro-interactions** for buttons, cards, and interactive elements
- **List item animations** with stagger effects
- **Gesture-based animations** for natural interactions

## Animation Components

### 1. AnimatedView

A versatile wrapper for animating any content with entrance effects.

```tsx
import { AnimatedView } from '../components/animated';

// Fade in
<AnimatedView animation="fade" delay={0}>
  <Text>This content fades in</Text>
</AnimatedView>

// Slide up
<AnimatedView animation="slide-up" delay={100}>
  <Text>This slides up smoothly</Text>
</AnimatedView>

// Scale
<AnimatedView animation="scale" delay={200}>
  <Text>This scales in</Text>
</AnimatedView>
```

**Props:**
- `animation`: "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale" | "none"
- `delay`: milliseconds to wait before animation starts
- `duration`: custom animation duration (optional)

### 2. AnimatedCard

Pressable cards with smooth entrance and press animations.

```tsx
import { AnimatedCard } from '../components/animated';

<AnimatedCard 
  onPress={() => navigation.navigate('Detail')}
  enterDelay={100}
  pressScale={0.98}
  className="p-4"
>
  <Text className="text-lg">Card Title</Text>
  <Text className="text-sm">Card description</Text>
</AnimatedCard>
```

**Props:**
- `onPress`: callback for press events
- `enterDelay`: delay before card enters (for stagger effect)
- `pressScale`: scale value when pressed (default: 0.98)
- `disabled`: disable interactions

### 3. AnimatedListItem

List items with automatic stagger animation based on index.

```tsx
import { AnimatedListItem } from '../components/animated';

{items.map((item, index) => (
  <AnimatedListItem
    key={item.id}
    index={index}
    onPress={() => handleItemPress(item)}
    staggerDelay={50}
  >
    <Text>{item.title}</Text>
  </AnimatedListItem>
))}
```

**Props:**
- `index`: item index (used for stagger calculation)
- `staggerDelay`: milliseconds between each item animation (default: 50)
- `onPress`: callback for press events

### 4. AnimatedModal

Full-screen modal with smooth slide-up transition.

```tsx
import { AnimatedModal } from '../components/animated';

<AnimatedModal
  isVisible={showModal}
  onClose={() => setShowModal(false)}
  backdropOpacity={0.5}
  slideFromBottom={true}
  className="p-6"
>
  <Text className="text-xl font-bold mb-4">Modal Title</Text>
  <Text>Modal content here</Text>
</AnimatedModal>
```

**Props:**
- `isVisible`: controls modal visibility
- `onClose`: callback when modal should close
- `backdropOpacity`: backdrop darkness (default: 0.5)
- `slideFromBottom`: slide direction (default: true)

### 5. AnimatedButton

Enhanced button with press feedback and loading states.

```tsx
import { AnimatedButton } from '../components/animated';

<AnimatedButton
  label="Continue"
  onPress={handleSubmit}
  variant="primary"
  size="medium"
  animationType="scale"
  loading={isLoading}
  iconRight={<ChevronRight color="#000" size={20} />}
/>
```

**Props:**
- `animationType`: "scale" | "bounce" | "none"
- `variant`: "primary" | "secondary" | "outline" | "ghost"
- `size`: "small" | "medium" | "large"
- `loading`: shows spinner when true

## Animation Hooks

### usePageTransition

For custom page transitions between screens.

```tsx
import { usePageTransition } from '../utils/reanimatedUtils';

const MyScreen = () => {
  const { enter, exit, animatedStyle } = usePageTransition('forward');

  useEffect(() => {
    enter();
  }, []);

  return (
    <Animated.View style={animatedStyle}>
      {/* Screen content */}
    </Animated.View>
  );
};
```

### useModalTransition

For custom modal/sheet animations.

```tsx
import { useModalTransition } from '../utils/reanimatedUtils';

const MyBottomSheet = ({ isVisible, onClose }) => {
  const { show, hide, modalStyle, backdropStyle } = useModalTransition(400);

  useEffect(() => {
    if (isVisible) {
      show();
    } else {
      hide(onClose);
    }
  }, [isVisible]);

  return (
    <>
      <Animated.View style={backdropStyle} />
      <Animated.View style={modalStyle}>
        {/* Sheet content */}
      </Animated.View>
    </>
  );
};
```

### usePressAnimation

For custom pressable components.

```tsx
import { usePressAnimation } from '../utils/reanimatedUtils';

const CustomButton = ({ onPress, children }) => {
  const { pressIn, pressOut, animatedStyle } = usePressAnimation(0.95);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={animatedStyle}
    >
      {children}
    </AnimatedPressable>
  );
};
```

### useListItemAnimation

For custom list item animations.

```tsx
import { useListItemAnimation } from '../utils/reanimatedUtils';

const ListItem = ({ index, children }) => {
  const { enter, animatedStyle } = useListItemAnimation(index, 50);

  useEffect(() => {
    enter();
  }, []);

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};
```

## Animation Constants

### Timing Configurations

```tsx
import { ANYDO_TIMING } from '../utils/reanimatedUtils';

// Quick micro-interactions (200ms)
ANYDO_TIMING.micro

// Standard UI transitions (300ms)
ANYDO_TIMING.standard

// Modal and sheet animations (350ms)
ANYDO_TIMING.modal

// Screen transitions (400ms)
ANYDO_TIMING.screen

// Emphasized animations (450ms)
ANYDO_TIMING.emphasized
```

### Spring Configurations

```tsx
import { ANYDO_SPRING } from '../utils/reanimatedUtils';

// Smooth and natural
ANYDO_SPRING.smooth

// Snappy response
ANYDO_SPRING.snappy

// Gentle bounce
ANYDO_SPRING.gentle
```

### Easing Functions

```tsx
import { ANYDO_EASING } from '../utils/reanimatedUtils';

// Smooth entrance
ANYDO_EASING.entrance

// Smooth exit
ANYDO_EASING.exit

// Standard smooth transition
ANYDO_EASING.standard

// Emphasize entrance
ANYDO_EASING.emphasize

// De-emphasize exit
ANYDO_EASING.deemphasize

// Smooth bounce
ANYDO_EASING.bounce
```

## Navigation Transitions

The app navigation uses smooth transitions:

### Main Screens
- **Cross-fade** transition (300ms) for switching between main modes
- Examples: Chat ↔ Admin ↔ Analytics ↔ NodoLab

### Secondary Screens
- **Default slide** transition (350ms) for pushing new screens
- Examples: Profile, MyListings, Favorites

### Modal Screens
- **Slide from bottom** (350ms) for modal presentations
- Examples: WebView, bottom sheets

## Best Practices

### 1. Stagger Delays
Use stagger effects for lists to create a cascading entrance:

```tsx
{items.map((item, index) => (
  <AnimatedCard key={item.id} enterDelay={index * 50}>
    {/* Card content */}
  </AnimatedCard>
))}
```

### 2. Loading States
Always provide feedback during async operations:

```tsx
<AnimatedButton
  label="Submit"
  onPress={handleSubmit}
  loading={isSubmitting}
  disabled={isSubmitting}
/>
```

### 3. Exit Animations
Clean up animations when components unmount to prevent memory leaks.

### 4. Performance
- Use `worklet` directive for animations running on UI thread
- Avoid animating layout properties when possible
- Use `transform` and `opacity` for better performance

### 5. Accessibility
Animations automatically respect user's motion preferences via the system settings.

## Examples

### Example 1: Animated Product List

```tsx
import { AnimatedListItem } from '../components/animated';

const ProductList = ({ products }) => {
  return (
    <ScrollView>
      {products.map((product, index) => (
        <AnimatedListItem
          key={product.id}
          index={index}
          onPress={() => handleProductPress(product)}
        >
          <View className="flex-row p-4 bg-background-secondary rounded-xl">
            <Image source={{ uri: product.image }} className="w-20 h-20" />
            <View className="ml-4 flex-1">
              <Text className="text-lg font-bold">{product.name}</Text>
              <Text className="text-primary">${product.price}</Text>
            </View>
          </View>
        </AnimatedListItem>
      ))}
    </ScrollView>
  );
};
```

### Example 2: Multi-step Form with Transitions

```tsx
import { AnimatedView } from '../components/animated';

const MultiStepForm = () => {
  const [step, setStep] = useState(1);

  return (
    <View className="flex-1">
      {step === 1 && (
        <AnimatedView animation="slide-right" key="step1">
          <StepOne onNext={() => setStep(2)} />
        </AnimatedView>
      )}
      
      {step === 2 && (
        <AnimatedView animation="slide-left" key="step2">
          <StepTwo onNext={() => setStep(3)} />
        </AnimatedView>
      )}
      
      {step === 3 && (
        <AnimatedView animation="fade" key="step3">
          <StepThree onComplete={handleComplete} />
        </AnimatedView>
      )}
    </View>
  );
};
```

### Example 3: Animated Settings Screen

```tsx
import { AnimatedCard, AnimatedView } from '../components/animated';

const SettingsScreen = () => {
  return (
    <ScrollView className="flex-1 p-4">
      <AnimatedView animation="fade" delay={0}>
        <Text className="text-2xl font-bold mb-6">Settings</Text>
      </AnimatedView>

      <AnimatedCard enterDelay={100} onPress={handleProfile} className="mb-4 p-4">
        <Text className="text-lg">Profile</Text>
      </AnimatedCard>

      <AnimatedCard enterDelay={150} onPress={handleNotifications} className="mb-4 p-4">
        <Text className="text-lg">Notifications</Text>
      </AnimatedCard>

      <AnimatedCard enterDelay={200} onPress={handlePrivacy} className="mb-4 p-4">
        <Text className="text-lg">Privacy</Text>
      </AnimatedCard>
    </ScrollView>
  );
};
```

## Troubleshooting

### Animations Not Working
1. Ensure `react-native-reanimated` is properly installed
2. Check that Reanimated plugin is in `babel.config.js`
3. Restart Metro bundler after config changes

### Jittery Animations
1. Use spring animations for natural movement
2. Avoid animating layout properties
3. Use `useAnimatedStyle` instead of inline styles

### Performance Issues
1. Reduce number of simultaneous animations
2. Use `shouldRasterizeIOS` for complex views
3. Profile with Xcode/Android Profiler

## Migration Guide

To convert existing static components to animated ones:

**Before:**
```tsx
<TouchableOpacity onPress={handlePress}>
  <View className="p-4 bg-background">
    <Text>Item</Text>
  </View>
</TouchableOpacity>
```

**After:**
```tsx
<AnimatedCard onPress={handlePress} className="p-4">
  <Text>Item</Text>
</AnimatedCard>
```

---

For more information, see:
- [React Native Reanimated Docs](https://docs.swmansion.com/react-native-reanimated/)
- [Animation Best Practices](https://reactnative.dev/docs/animations)
