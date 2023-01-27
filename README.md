# ArmLengthSimulation

A simple simulation written in Typescript to calculate the optimal lengths for a 3-segment arm by traversing the entire discrete input space.

Since we decided to round each length value to the nearest integer inch, the input space to the function that computes output torque is discrete and the entire domain is only several hundred possibilities. This allows us to just bruteforce all the possible inputs.

This is in contrast to the alternative method for optimizing the continous variant of the function which requires taking the gradient of the `n`-variable torque function (where `n` is the number of arm segments) and implementing gradient descent.

The simulation also factors in material density, positions and weights of motor assemblies, and much more.
