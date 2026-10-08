package br.com.rolemoto.app.telemetria;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
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
            if (item.has("provider") && !item.isNull("provider")) {
                ponto.put("provider", item.optString("provider"));
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

    /**
     * Antes do Android 9 não há como ler a política de localização da economia:
     * com ela ligada, assume que corta o GPS.
     */
    @PluginMethod
    public void statusEnergia(PluginCall call) {
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        boolean economiaAtiva = pm != null && pm.isPowerSaveMode();
        boolean afetaGps = economiaAtiva;
        if (economiaAtiva && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            afetaGps = pm.getLocationPowerSaveMode() != PowerManager.LOCATION_MODE_NO_CHANGE;
        }
        JSObject ret = new JSObject();
        ret.put("economiaAtiva", economiaAtiva);
        ret.put("afetaGps", afetaGps);
        call.resolve(ret);
    }

    @PluginMethod
    public void abrirAjustesEconomia(PluginCall call) {
        Context context = getContext();
        try {
            context.startActivity(
                new Intent(Settings.ACTION_BATTERY_SAVER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            );
        } catch (ActivityNotFoundException e) {
            context.startActivity(new Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }
        call.resolve();
    }
}
