package br.com.rolemoto.app.telemetria;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "TelemetriaBuffer")
public class TelemetriaBufferPlugin extends Plugin {

    @PluginMethod
    public void iniciar(PluginCall call) {
        TelemetriaBufferStore.iniciarNovaSessao(getContext());
        call.resolve();
    }

    @PluginMethod
    public void garantir(PluginCall call) {
        TelemetriaBufferStore.garantirListener(getContext());
        call.resolve();
    }

    @PluginMethod
    public void parar(PluginCall call) {
        TelemetriaBufferStore.parar();
        call.resolve();
    }

    @PluginMethod
    public void listar(PluginCall call) {
        JSONArray bruto = TelemetriaBufferStore.listar(getContext());
        JSArray pontos = new JSArray();
        for (int i = 0; i < bruto.length(); i++) {
            JSONObject item = bruto.optJSONObject(i);
            if (item == null) {
                continue;
            }
            JSObject ponto = new JSObject();
            ponto.put("lat", item.optDouble("lat"));
            ponto.put("lng", item.optDouble("lng"));
            ponto.put("t", item.optLong("t"));
            if (item.has("speed") && !item.isNull("speed")) {
                ponto.put("speed", item.optDouble("speed"));
            }
            if (item.has("accuracy") && !item.isNull("accuracy")) {
                ponto.put("accuracy", item.optDouble("accuracy"));
            }
            pontos.put(ponto);
        }
        JSObject ret = new JSObject();
        ret.put("pontos", pontos);
        call.resolve(ret);
    }

    @PluginMethod
    public void limpar(PluginCall call) {
        TelemetriaBufferStore.limpar(getContext());
        call.resolve();
    }
}
