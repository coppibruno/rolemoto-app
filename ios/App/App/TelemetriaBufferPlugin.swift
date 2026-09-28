import Capacitor
import CoreLocation
import Foundation

private let nomeArquivo = "rolemoto-telemetria-buffer.jsonl"
private let maxPontos = 15_000

final class TelemetriaBufferStore: NSObject, CLLocationManagerDelegate {
    static let shared = TelemetriaBufferStore()

    private let manager = CLLocationManager()
    private let fila = DispatchQueue(label: "br.com.rolemoto.telemetria-buffer")

    private override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = 5
        manager.allowsBackgroundLocationUpdates = true
        manager.pausesLocationUpdatesAutomatically = false
    }

    func iniciarNovaSessao() {
        limpar()
        garantirListener()
    }

    func garantirListener() {
        DispatchQueue.main.async {
            self.manager.startUpdatingLocation()
        }
    }

    func parar() {
        DispatchQueue.main.async {
            self.manager.stopUpdatingLocation()
        }
    }

    func listar() -> [[String: Any]] {
        fila.sync { lerPontos() }
    }

    func limpar() {
        fila.sync {
            try? FileManager.default.removeItem(at: urlArquivo())
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        append(location)
    }

    private func append(_ location: CLLocation) {
        var obj: [String: Any] = [
            "lat": location.coordinate.latitude,
            "lng": location.coordinate.longitude,
            "t": Int(location.timestamp.timeIntervalSince1970 * 1000),
            "accuracy": location.horizontalAccuracy
        ]
        if location.speed >= 0 {
            obj["speed"] = location.speed
        }
        fila.async {
            guard let data = try? JSONSerialization.data(withJSONObject: obj),
                  var linha = String(data: data, encoding: .utf8) else {
                return
            }
            linha.append("\n")
            let url = self.urlArquivo()
            if FileManager.default.fileExists(atPath: url.path) {
                if let handle = try? FileHandle(forWritingTo: url) {
                    defer { try? handle.close() }
                    handle.seekToEndOfFile()
                    if let bytes = linha.data(using: .utf8) {
                        handle.write(bytes)
                    }
                }
            } else {
                try? linha.data(using: .utf8)?.write(to: url)
            }
            self.compactarSeNecessario()
        }
    }

    private func lerPontos() -> [[String: Any]] {
        guard let data = try? Data(contentsOf: urlArquivo()),
              let texto = String(data: data, encoding: .utf8) else {
            return []
        }
        var pontos: [[String: Any]] = []
        for linha in texto.split(whereSeparator: \.isNewline) {
            guard let linhaData = String(linha).data(using: .utf8),
                  let obj = try? JSONSerialization.jsonObject(with: linhaData) as? [String: Any] else {
                continue
            }
            pontos.append(obj)
        }
        return pontos
    }

    private func compactarSeNecessario() {
        guard let attrs = try? FileManager.default.attributesOfItem(atPath: urlArquivo().path),
              let tamanho = attrs[.size] as? NSNumber,
              tamanho.intValue > 1_500_000 else {
            return
        }
        let pontos = lerPontos()
        guard pontos.count > maxPontos else { return }
        let fatia = pontos.suffix(maxPontos)
        var texto = ""
        for ponto in fatia {
            if let data = try? JSONSerialization.data(withJSONObject: ponto),
               let linha = String(data: data, encoding: .utf8) {
                texto += linha + "\n"
            }
        }
        try? texto.data(using: .utf8)?.write(to: urlArquivo())
    }

    private func urlArquivo() -> URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
            ?? FileManager.default.temporaryDirectory
        return docs.appendingPathComponent(nomeArquivo)
    }
}

@objc(TelemetriaBufferPlugin)
public class TelemetriaBufferPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TelemetriaBufferPlugin"
    public let jsName = "TelemetriaBuffer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "iniciar", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "garantir", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "parar", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listar", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "limpar", returnType: CAPPluginReturnPromise)
    ]

    @objc func iniciar(_ call: CAPPluginCall) {
        TelemetriaBufferStore.shared.iniciarNovaSessao()
        call.resolve()
    }

    @objc func garantir(_ call: CAPPluginCall) {
        TelemetriaBufferStore.shared.garantirListener()
        call.resolve()
    }

    @objc func parar(_ call: CAPPluginCall) {
        TelemetriaBufferStore.shared.parar()
        call.resolve()
    }

    @objc func listar(_ call: CAPPluginCall) {
        call.resolve(["pontos": TelemetriaBufferStore.shared.listar()])
    }

    @objc func limpar(_ call: CAPPluginCall) {
        TelemetriaBufferStore.shared.limpar()
        call.resolve()
    }
}
