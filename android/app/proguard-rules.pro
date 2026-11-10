# O R8 já aplica as consumer rules do Capacitor: plugins e @PluginMethod
# ficam acessíveis por reflexão. Não acrescentar -keep amplo
# (com.getcapacitor.**, com.google.**): isso derruba a ofuscação que o Play mede.

# Stack trace ainda mostra a linha. O arquivo vira "SourceFile";
# o mapping.txt (outputs/mapping/release) desofusca no Play Console.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
