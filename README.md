# disco

SSB search application.
Uses [levi](https://github.com/cshum/levi) and [scuttlebot](https://github.com/ssbc/docs).

## Example:

:~/disco⭐  ./bin.js whois paul -p
"@hxGxqPrplLjRG2vtjQL87abX4QKqeLgCwQpS730nNwE=.ed25519" # hit 1

[ # references:
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 recps paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 recps paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@GLH9VPzvvU2KcnnUu2n5oxOqaTUtzw+Rk6fd/Kb9Si0=.ed25519 mentions paul",
  "@hxGxqPrplLjRG2vtjQL87abX4QKqeLgCwQpS730nNwE=.ed25519 mentions paul",
  "@hxGxqPrplLjRG2vtjQL87abX4QKqeLgCwQpS730nNwE=.ed25519 about paul",
  "@jpq43ybzjW+u2lABZCPD8OVVvp85CKeY4qSlXTA31j4=.ed25519 mentions paul",
  "@jpq43ybzjW+u2lABZCPD8OVVvp85CKeY4qSlXTA31j4=.ed25519 mentions paul",
  "@jpq43ybzjW+u2lABZCPD8OVVvp85CKeY4qSlXTA31j4=.ed25519 mentions paul",
  "@ye+QM09iPcDJD6YvQYjoQc7sLF/IFhmNbEqgdzQo3lQ=.ed25519 mentions paul",
  "@ye+QM09iPcDJD6YvQYjoQc7sLF/IFhmNbEqgdzQo3lQ=.ed25519 mentions paul",
  "@ye+QM09iPcDJD6YvQYjoQc7sLF/IFhmNbEqgdzQo3lQ=.ed25519 mentions paul",
  "@ye+QM09iPcDJD6YvQYjoQc7sLF/IFhmNbEqgdzQo3lQ=.ed25519 mentions paul"
]

"@GLH9VPzvvU2KcnnUu2n5oxOqaTUtzw+Rk6fd/Kb9Si0=.ed25519"  # hit 2

[ # references:
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions myf",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions myf"
]

"@jpq43ybzjW+u2lABZCPD8OVVvp85CKeY4qSlXTA31j4=.ed25519" # hit 3

[ # references
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 recps mafintosh"
]

"@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519" #hit 4

[ # references
  "@GLH9VPzvvU2KcnnUu2n5oxOqaTUtzw+Rk6fd/Kb9Si0=.ed25519 mentions Dominic",
  "@jpq43ybzjW+u2lABZCPD8OVVvp85CKeY4qSlXTA31j4=.ed25519 mentions Dominic"
]

"@uRECWB4KIeKoNMis2UYWyB2aQPvWmS3OePQvBj2zClg=.ed25519" # hit 5

[ #references
  "@ye+QM09iPcDJD6YvQYjoQc7sLF/IFhmNbEqgdzQo3lQ=.ed25519 mentions mix_pub"
]

:~/disco⭐  ./bin.js whois dominic -p
"@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519"

[
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 about Dominic",
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions Dominic",
  "@GLH9VPzvvU2KcnnUu2n5oxOqaTUtzw+Rk6fd/Kb9Si0=.ed25519 mentions Dominic",
  "@GLH9VPzvvU2KcnnUu2n5oxOqaTUtzw+Rk6fd/Kb9Si0=.ed25519 mentions Dominic",
  "@GLH9VPzvvU2KcnnUu2n5oxOqaTUtzw+Rk6fd/Kb9Si0=.ed25519 mentions Dominic",
  "@V/0ZcEFyPagUhs6Cqc9Su98rpzna4zBRXXbAZOtF6p4=.ed25519 about Allegedly Dominic",
  "@hxGxqPrplLjRG2vtjQL87abX4QKqeLgCwQpS730nNwE=.ed25519 mentions Dominic",
  "@hxGxqPrplLjRG2vtjQL87abX4QKqeLgCwQpS730nNwE=.ed25519 mentions Dominic",
  "@hxGxqPrplLjRG2vtjQL87abX4QKqeLgCwQpS730nNwE=.ed25519 mentions Dominic",
  "@hxGxqPrplLjRG2vtjQL87abX4QKqeLgCwQpS730nNwE=.ed25519 mentions Dominic",
  "@hxGxqPrplLjRG2vtjQL87abX4QKqeLgCwQpS730nNwE=.ed25519 mentions Dominic",
  "@hxGxqPrplLjRG2vtjQL87abX4QKqeLgCwQpS730nNwE=.ed25519 mentions Dominic",
  "@hxGxqPrplLjRG2vtjQL87abX4QKqeLgCwQpS730nNwE=.ed25519 mentions Dominic",
  "@hxGxqPrplLjRG2vtjQL87abX4QKqeLgCwQpS730nNwE=.ed25519 mentions Dominic",
  "@hxGxqPrplLjRG2vtjQL87abX4QKqeLgCwQpS730nNwE=.ed25519 mentions Dominic",
  "@hxGxqPrplLjRG2vtjQL87abX4QKqeLgCwQpS730nNwE=.ed25519 mentions Dominic",
  "@jpq43ybzjW+u2lABZCPD8OVVvp85CKeY4qSlXTA31j4=.ed25519 mentions Dominic",
  "@ye+QM09iPcDJD6YvQYjoQc7sLF/IFhmNbEqgdzQo3lQ=.ed25519 mentions Dominic",
  "@ye+QM09iPcDJD6YvQYjoQc7sLF/IFhmNbEqgdzQo3lQ=.ed25519 mentions Dominic"
]

"@hxGxqPrplLjRG2vtjQL87abX4QKqeLgCwQpS730nNwE=.ed25519"

[
  "@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519 mentions paul",
  "@GLH9VPzvvU2KcnnUu2n5oxOqaTUtzw+Rk6fd/Kb9Si0=.ed25519 mentions paul",
  "@jpq43ybzjW+u2lABZCPD8OVVvp85CKeY4qSlXTA31j4=.ed25519 mentions paul"
]

"@J+0DGLgRn8H5tVLCcRUfN7NfUcTGEZKqML3krEOJjDY=.ed25519"

[
  "@ye+QM09iPcDJD6YvQYjoQc7sLF/IFhmNbEqgdzQo3lQ=.ed25519 about dominic's pub",
  "@ye+QM09iPcDJD6YvQYjoQc7sLF/IFhmNbEqgdzQo3lQ=.ed25519 mentions patchwork"
]

"@ye+QM09iPcDJD6YvQYjoQc7sLF/IFhmNbEqgdzQo3lQ=.ed25519"

[
  "@hxGxqPrplLjRG2vtjQL87abX4QKqeLgCwQpS730nNwE=.ed25519 mentions mixmix"
]
```
