package br.com.rolemoto.app;

import android.os.Bundle;
import br.com.rolemoto.app.telemetria.TelemetriaBufferPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TelemetriaBufferPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
