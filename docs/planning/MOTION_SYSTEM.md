# Motion System

Motion must explain a state change and remain optional.

| Pattern | Timing | Use |
| --- | --- | --- |
| Tap response | 120–160 ms | Scale to .98 and restore |
| Page enter | 220 ms | 8 px fade/translate |
| Card reveal | 260 ms | Staggered 30 ms children |
| Sheet | spring 420/34 | Bottom sheet rise/dismiss |
| Shared card/detail | 280–360 ms | Exam, notification, streak details |
| Success | 420 ms | Check scale + restrained particles |
| Marker | spring 360/24 | +1/−1 and annotation pin |
| Count-up | 500–800 ms | Metrics/recovered points |
| Sync | continuous | Ring only while a real sync job runs |

Reduced motion removes translation, spring, parallax, count-up, and particles; state changes become short opacity transitions. No animation blocks input, changes layout unexpectedly, or claims progress the backend has not reported.
