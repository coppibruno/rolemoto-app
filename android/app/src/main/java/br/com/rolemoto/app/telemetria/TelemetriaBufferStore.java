package br.com.rolemoto.app.telemetria;

import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Looper;
import androidx.annotation.NonNull;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Buffer de pontos GPS fora do WebView. O FGS do Capgo mantém o processo vivo
 * com a tela off; este listener nativo continua gravando no disco.
 */
final class TelemetriaBufferStore {

    static final String ARQUIVO = "rolemoto-telemetria-buffer.jsonl";
    private static final int MAX_PONTOS = 15_000;
    private static final long INTERVALO_MS = 2000L;
    private static final float FILTRO_M = 5f;

    private static LocationManager manager;
    private static Context appContext;
    private static boolean ouvindo;

    private static final LocationListener listener = new LocationListener() {
        @Override
        public void onLocationChanged(@NonNull Location location) {
            if (appContext != null) {
                append(appContext, location);
            }
        }
    };

    private TelemetriaBufferStore() {}

    static synchronized void iniciarNovaSessao(Context context) {
        Context app = context.getApplicationContext();
        limpar(app);
        garantirListener(app);
    }

    static synchronized void garantirListener(Context context) {
        appContext = context.getApplicationContext();
        if (ouvindo) {
            return;
        }
        manager = (LocationManager) appContext.getSystemService(Context.LOCATION_SERVICE);
        if (manager == null) {
            return;
        }
        try {
            manager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                INTERVALO_MS,
                FILTRO_M,
                listener,
                Looper.getMainLooper()
            );
            if (manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                manager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    INTERVALO_MS,
                    FILTRO_M,
                    listener,
                    Looper.getMainLooper()
                );
            }
            ouvindo = true;
        } catch (SecurityException ignore) {
            ouvindo = false;
        }
    }

    static synchronized void parar() {
        if (manager != null && ouvindo) {
            try {
                manager.removeUpdates(listener);
            } catch (SecurityException ignore) {
                /* já sem permissão */
            }
        }
        ouvindo = false;
    }

    static synchronized void append(Context context, Location location) {
        JSONObject obj = new JSONObject();
        try {
            obj.put("lat", location.getLatitude());
            obj.put("lng", location.getLongitude());
            obj.put("t", location.getTime() > 0 ? location.getTime() : System.currentTimeMillis());
            if (location.hasSpeed()) {
                obj.put("speed", location.getSpeed());
            } else {
                obj.put("speed", JSONObject.NULL);
            }
            if (location.hasAccuracy()) {
                obj.put("accuracy", location.getAccuracy());
            } else {
                obj.put("accuracy", JSONObject.NULL);
            }
        } catch (JSONException ignore) {
            return;
        }
        File arquivo = arquivo(context);
        try (FileOutputStream fos = new FileOutputStream(arquivo, true)) {
            fos.write((obj.toString() + "\n").getBytes(StandardCharsets.UTF_8));
        } catch (IOException ignore) {
            /* disco cheio / permissão — o JS ainda agrega com a tela ligada */
        }
        compactarSeNecessario(context);
    }

    static synchronized JSONArray listar(Context context) {
        JSONArray pontos = new JSONArray();
        File arquivo = arquivo(context);
        if (!arquivo.exists()) {
            return pontos;
        }
        try (
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(new FileInputStream(arquivo), StandardCharsets.UTF_8)
            )
        ) {
            String linha;
            while ((linha = reader.readLine()) != null) {
                if (linha.trim().isEmpty()) {
                    continue;
                }
                try {
                    pontos.put(new JSONObject(linha));
                } catch (JSONException ignore) {
                    /* linha corrompida */
                }
            }
        } catch (IOException ignore) {
            return pontos;
        }
        return pontos;
    }

    static synchronized void limpar(Context context) {
        File arquivo = arquivo(context);
        if (arquivo.exists()) {
            //noinspection ResultOfMethodCallIgnored
            arquivo.delete();
        }
    }

    private static File arquivo(Context context) {
        return new File(context.getApplicationContext().getFilesDir(), ARQUIVO);
    }

    private static void compactarSeNecessario(Context context) {
        File arquivo = arquivo(context);
        if (!arquivo.exists() || arquivo.length() < 1_500_000L) {
            return;
        }
        JSONArray todos = listar(context);
        if (todos.length() <= MAX_PONTOS) {
            return;
        }
        int inicio = todos.length() - MAX_PONTOS;
        StringBuilder builder = new StringBuilder();
        for (int i = inicio; i < todos.length(); i++) {
            builder.append(todos.optJSONObject(i)).append('\n');
        }
        try (FileOutputStream fos = new FileOutputStream(arquivo, false)) {
            fos.write(builder.toString().getBytes(StandardCharsets.UTF_8));
        } catch (IOException ignore) {
            /* mantém o arquivo original */
        }
    }
}
