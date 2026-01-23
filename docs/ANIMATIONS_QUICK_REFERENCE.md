# Animations Quick Reference

## Import Statements

```tsx
// Components
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedListItem,
  AnimatedModal,
  AnimatedView,
} from '../components/animated';

// Hooks
import {
  usePageTransition,
  useModalTransition,
  usePressAnimation,
  useListItemAnimation,
  useCrossFadeTransition,
} from '../utils/reanimatedUtils';

// Constants
import {
  ANYDO_EASING,
  ANYDO_TIMING,
  ANYDO_SPRING,
} from '../utils/reanimatedUtils';
```

## Component Cheat Sheet

### AnimatedView
```tsx
<AnimatedView 
  animation="fade|slide-up|slide-down|slide-left|slide-right|scale" 
  delay={0}
  duration={300}
>
  {children}
</AnimatedView>
```

### AnimatedCard
```tsx
<AnimatedCard 
  onPress={handler}
  enterDelay={0}
  pressScale={0.98}
  disabled={false}
>
  {children}
</AnimatedCard>
```

### AnimatedListItem
```tsx
<AnimatedListItem 
  index={i}
  onPress={handler}
  staggerDelay={50}
>
  {children}
</AnimatedListItem>
```

### AnimatedModal
```tsx
<AnimatedModal 
  isVisible={bool}
  onClose={handler}
  backdropOpacity={0.5}
  slideFromBottom={true}
>
  {children}
</AnimatedModal>
```

### AnimatedButton
```tsx
<AnimatedButton
  label="Text"
  onPress={handler}
  variant="primary|secondary|outline|ghost"
  size="small|medium|large"
  animationType="scale|bounce|none"
  loading={false}
  disabled={false}
  iconLeft={<Icon />}
  iconRight={<Icon />}
/>
```

## Animation Timings

| Type | Duration | Use Case |
|------|----------|----------|
| `ANYDO_TIMING.micro` | 200ms | Button press, tap feedback |
| `ANYDO_TIMING.standard` | 300ms | Standard UI transitions |
| `ANYDO_TIMING.modal` | 350ms | Modals, bottom sheets |
| `ANYDO_TIMING.screen` | 400ms | Screen navigation |
| `ANYDO_TIMING.emphasized` | 450ms | Important actions |

## Easing Functions

| Function | Bezier | Use Case |
|----------|--------|----------|
| `ANYDO_EASING.entrance` | (0.25, 0.46, 0.45, 0.94) | Modal enters, screen appears |
| `ANYDO_EASING.exit` | (0.55, 0.085, 0.68, 0.53) | Modal closes, screen exits |
| `ANYDO_EASING.standard` | (0.4, 0, 0.2, 1) | General transitions |
| `ANYDO_EASING.emphasize` | (0, 0, 0.2, 1) | Important entrances |
| `ANYDO_EASING.bounce` | (0.68, -0.55, 0.265, 1.55) | Playful interactions |

## Spring Configs

| Config | Settings | Feel |
|--------|----------|------|
| `ANYDO_SPRING.smooth` | damping: 20, stiffness: 100 | Natural, fluid |
| `ANYDO_SPRING.snappy` | damping: 18, stiffness: 150 | Quick, responsive |
| `ANYDO_SPRING.gentle` | damping: 15, stiffness: 120 | Soft, bouncy |

## Common Patterns

### Staggered List
```tsx
{items.map((item, i) => (
  <AnimatedListItem key={item.id} index={i}>
    <ItemContent />
  </AnimatedListItem>
))}
```

### Card Grid
```tsx
{cards.map((card, i) => (
  <AnimatedCard 
    key={card.id} 
    enterDelay={i * 50}
    onPress={() => navigate(card.route)}
  >
    <CardContent />
  </AnimatedCard>
))}
```

### Modal Flow
```tsx
const [show, setShow] = useState(false);

<AnimatedModal isVisible={show} onClose={() => setShow(false)}>
  <ModalContent />
</AnimatedModal>
```

### Page Sections
```tsx
<AnimatedView animation="fade" delay={0}>
  <Header />
</AnimatedView>

<AnimatedView animation="slide-up" delay={100}>
  <MainContent />
</AnimatedView>

<AnimatedView animation="slide-up" delay={200}>
  <Footer />
</AnimatedView>
```

### Loading Button
```tsx
const [loading, setLoading] = useState(false);

<AnimatedButton
  label="Submit"
  onPress={async () => {
    setLoading(true);
    await submitForm();
    setLoading(false);
  }}
  loading={loading}
  disabled={loading}
/>
```

## Navigation Transitions

| Screen Type | Animation | Duration |
|-------------|-----------|----------|
| Main screens | Cross-fade | 300ms |
| Secondary screens | Slide | 350ms |
| Modal screens | Slide from bottom | 350ms |

## Performance Tips

✅ **Do:**
- Use `transform` and `opacity`
- Animate on UI thread with `worklet`
- Reuse shared values
- Memoize animated styles

❌ **Don't:**
- Animate `width`, `height`, or `layout` properties
- Create new animated values on each render
- Use inline styles with animations
- Animate too many elements simultaneously

## Testing Checklist

- [ ] Smooth on 60fps devices
- [ ] No jank on older devices
- [ ] Works with accessibility settings
- [ ] Respects reduced motion
- [ ] Looks good on both iOS and Android

## Common Issues

### Animation not running
- Check if Reanimated is properly configured
- Verify `worklet` directive for custom functions
- Restart Metro bundler

### Jittery movement
- Use spring animations instead of timing
- Reduce number of simultaneous animations
- Check for layout thrashing

### Poor performance
- Profile with React DevTools
- Reduce animation complexity
- Use `shouldRasterizeIOS` for complex views

---

**Quick Links:**
- Full Guide: `ANIMATIONS_GUIDE.md`
- Implementation Summary: `ANIMATIONS_IMPLEMENTATION_SUMMARY.md`
