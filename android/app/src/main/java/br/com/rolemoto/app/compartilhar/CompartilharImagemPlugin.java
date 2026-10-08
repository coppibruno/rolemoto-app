package br.com.rolemoto.app.compartilhar;

import android.content.ClipData;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

/** O WebView não tem `navigator.share` nem baixa blob: a imagem sai por aqui. */
@CapacitorPlugin(name = "CompartilharImagem")
public class CompartilharImagemPlugin extends Plugin {

    private static final String PASTA_GALERIA = "Rolemoto";
    private static final String MIME = "image/png";

    @PluginMethod
    public void compartilhar(PluginCall call) {
        byte[] bytes = decodificar(call);
        if (bytes == null) return;
        Context context = getContext();
        try {
            File pasta = new File(context.getCacheDir(), "compartilhar");
            if (!pasta.exists() && !pasta.mkdirs()) {
                call.reject("Sem espaço para a imagem");
                return;
            }
            File arquivo = new File(pasta, nome(call));
            try (FileOutputStream fos = new FileOutputStream(arquivo, false)) {
                fos.write(bytes);
            }
            Uri uri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", arquivo);
            Intent envio = new Intent(Intent.ACTION_SEND);
            envio.setType(MIME);
            envio.putExtra(Intent.EXTRA_STREAM, uri);
            String texto = call.getString("texto", "");
            if (texto != null && !texto.isEmpty()) {
                envio.putExtra(Intent.EXTRA_TEXT, texto);
            }
            envio.setClipData(ClipData.newRawUri("", uri));
            envio.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent seletor = Intent.createChooser(envio, null);
            seletor.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            context.startActivity(seletor);
            call.resolve();
        } catch (IOException | IllegalArgumentException e) {
            call.reject("Não foi possível compartilhar", e);
        }
    }

    /** Antes do Android 10 gravar na galeria exige permissão de armazenamento: devolve `salvo: false`. */
    @PluginMethod
    public void salvar(PluginCall call) {
        byte[] bytes = decodificar(call);
        if (bytes == null) return;
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            ret.put("salvo", false);
            call.resolve(ret);
            return;
        }
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues valores = new ContentValues();
        valores.put(MediaStore.Images.Media.DISPLAY_NAME, nome(call));
        valores.put(MediaStore.Images.Media.MIME_TYPE, MIME);
        valores.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/" + PASTA_GALERIA);
        valores.put(MediaStore.Images.Media.IS_PENDING, 1);
        Uri uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, valores);
        if (uri == null) {
            call.reject("Não foi possível salvar a imagem");
            return;
        }
        try (OutputStream out = resolver.openOutputStream(uri)) {
            if (out == null) throw new IOException("Sem saída");
            out.write(bytes);
        } catch (IOException e) {
            resolver.delete(uri, null, null);
            call.reject("Não foi possível salvar a imagem", e);
            return;
        }
        valores.clear();
        valores.put(MediaStore.Images.Media.IS_PENDING, 0);
        resolver.update(uri, valores, null, null);
        ret.put("salvo", true);
        call.resolve(ret);
    }

    private byte[] decodificar(PluginCall call) {
        String base64 = call.getString("base64");
        if (base64 == null || base64.isEmpty()) {
            call.reject("Imagem ausente");
            return null;
        }
        int virgula = base64.indexOf(',');
        if (base64.startsWith("data:") && virgula >= 0) {
            base64 = base64.substring(virgula + 1);
        }
        try {
            return Base64.decode(base64, Base64.DEFAULT);
        } catch (IllegalArgumentException e) {
            call.reject("Imagem inválida", e);
            return null;
        }
    }

    private String nome(PluginCall call) {
        String nome = call.getString("nome", "telemetria.png");
        if (nome == null || nome.isEmpty()) return "telemetria.png";
        return nome.replaceAll("[^A-Za-z0-9._-]", "-");
    }
}
