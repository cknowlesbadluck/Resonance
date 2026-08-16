import SwiftUI
import ResonanceCore

@main
struct ResonanceApp: App {
    var body: some Scene {
        WindowGroup {
            ResonanceRootView()
        }
    }
}

private enum ResonanceTab: Hashable {
    case nexus
    case executions
    case capabilities
    case evidence
}

struct ResonanceRootView: View {
    @State private var selectedTab: ResonanceTab = .nexus

    var body: some View {
        TabView(selection: $selectedTab) {
            NexusAstrolabeView()
                .tabItem { Label("Nexus", systemImage: "circle.hexagongrid.fill") }
                .tag(ResonanceTab.nexus)

            ExecutionsView()
                .tabItem { Label("Executions", systemImage: "bolt.fill") }
                .tag(ResonanceTab.executions)

            CapabilitiesView()
                .tabItem { Label("Capabilities", systemImage: "square.stack.3d.up.fill") }
                .tag(ResonanceTab.capabilities)

            EvidenceView()
                .tabItem { Label("Evidence", systemImage: "checkmark.seal.fill") }
                .tag(ResonanceTab.evidence)
        }
        .tint(.white)
    }
}

private struct NexusAstrolabeView: View {
    @State private var astrolabe = NexusAstrolabe()
    @State private var dragRotation: Double = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        NavigationStack {
            ZStack {
                NexusAtmosphere()

                VStack(spacing: 0) {
                    header
                    Spacer(minLength: 8)

                    GeometryReader { proxy in
                        let size = min(proxy.size.width, proxy.size.height)
                        ZStack {
                            AstrolabeOrbitField(
                                astrolabe: astrolabe,
                                size: size,
                                onFocus: { role in astrolabe.focus(role) }
                            )
                            NexusCore(
                                focus: astrolabe.focus,
                                reduceMotion: reduceMotion
                            )
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .contentShape(Rectangle())
                        .gesture(
                            DragGesture(minimumDistance: 4)
                                .onChanged { value in
                                    let delta = Double(value.translation.width) * 0.32
                                    astrolabe.rotate(by: delta - dragRotation)
                                    dragRotation = delta
                                }
                                .onEnded { _ in dragRotation = 0 }
                        )
                    }

                    bottomReadout
                }
                .padding(.horizontal, 18)
            }
            .ignoresSafeArea(edges: .bottom)
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 3) {
                Text("RESONANCE")
                    .font(.caption.weight(.bold))
                    .tracking(3.2)
                    .foregroundStyle(.white.opacity(0.72))
                Text("Nexus")
                    .font(.system(size: 34, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 5) {
                Label("ONLINE", systemImage: "circle.fill")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(.mint)
                Text("DRAG TO ALIGN")
                    .font(.system(size: 8, weight: .medium, design: .monospaced))
                    .tracking(1.2)
                    .foregroundStyle(.white.opacity(0.45))
            }
        }
        .padding(.top, 18)
    }

    private var bottomReadout: some View {
        HStack(spacing: 12) {
            Image(systemName: symbol(for: astrolabe.focus))
                .font(.headline)
                .frame(width: 38, height: 38)
                .background(.white.opacity(0.09), in: Circle())

            VStack(alignment: .leading, spacing: 2) {
                Text(title(for: astrolabe.focus))
                    .font(.headline)
                    .foregroundStyle(.white)
                Text(subtitle(for: astrolabe.focus))
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.52))
            }

            Spacer()
            Text(String(format: "%03d°", Int(astrolabe.rotation.rounded())))
                .font(.system(size: 12, weight: .medium, design: .monospaced))
                .foregroundStyle(.white.opacity(0.5))
        }
        .padding(14)
        .background(.ultraThinMaterial.opacity(0.72), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(.white.opacity(0.13), lineWidth: 1)
        }
        .padding(.bottom, 18)
    }

    private func title(for focus: NexusFocus) -> String {
        switch focus {
        case .nexus: "Nexus Core"
        case .intent: "Intent Layer"
        case .plan: "Plan Layer"
        case .execution: "Execution Layer"
        case .evidence: "Evidence Layer"
        }
    }

    private func subtitle(for focus: NexusFocus) -> String {
        switch focus {
        case .nexus: "System alignment is nominal"
        case .intent: "What Resonance has been asked to do"
        case .plan: "How the objective will be accomplished"
        case .execution: "Work currently moving through the Nexus"
        case .evidence: "What can be proven about the result"
        }
    }

    private func symbol(for focus: NexusFocus) -> String {
        switch focus {
        case .nexus: "circle.hexagongrid.fill"
        case .intent: "sparkles"
        case .plan: "point.3.connected.trianglepath.dotted"
        case .execution: "bolt.fill"
        case .evidence: "checkmark.seal.fill"
        }
    }
}

private struct NexusAtmosphere: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(red: 0.025, green: 0.035, blue: 0.075), Color.black, Color(red: 0.055, green: 0.025, blue: 0.09)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            RadialGradient(
                colors: [.purple.opacity(0.24), .clear],
                center: .center,
                startRadius: 10,
                endRadius: 330
            )
            RadialGradient(
                colors: [.cyan.opacity(0.12), .clear],
                center: .topLeading,
                startRadius: 10,
                endRadius: 260
            )
        }
    }
}

private struct AstrolabeOrbitField: View {
    let astrolabe: NexusAstrolabe
    let size: CGFloat
    let onFocus: (NexusFocus) -> Void

    var body: some View {
        ZStack {
            starDust

            ForEach(Array(astrolabe.layers.enumerated()), id: \.element.role) { index, layer in
                orbit(index: index, layer: layer)
            }

            Circle()
                .stroke(.white.opacity(0.12), style: StrokeStyle(lineWidth: 1, dash: [2, 7]))
                .frame(width: size * 0.83, height: size * 0.83)
                .rotationEffect(.degrees(astrolabe.rotation * -0.4))

            AstrolabeArm(rotation: astrolabe.rotation)
        }
        .rotation3DEffect(.degrees(8), axis: (x: 1, y: 0, z: 0))
    }

    private func orbit(index: Int, layer: NexusAstrolabeLayer) -> some View {
        let diameter = size * (0.43 + CGFloat(index) * 0.15)
        let focus: NexusFocus = NexusFocus(rawValue: layer.role.rawValue) ?? .nexus
        let isFocused = astrolabe.focus == focus

        return ZStack {
            Circle()
                .stroke(
                    AngularGradient(
                        colors: [.white.opacity(0.05), .cyan.opacity(0.4), .purple.opacity(0.34), .white.opacity(0.05)],
                        center: .center
                    ),
                    style: StrokeStyle(lineWidth: isFocused ? 2.5 : 1, dash: index.isMultiple(of: 2) ? [3, 8] : [1, 12])
                )
                .frame(width: diameter, height: diameter)
                .rotationEffect(.degrees(astrolabe.rotation * (index.isMultiple(of: 2) ? 1 : -0.7)))

            ForEach(0..<6, id: \.self) { mark in
                Capsule()
                    .fill(.white.opacity(isFocused ? 0.65 : 0.26))
                    .frame(width: 2, height: index == 3 ? 14 : 9)
                    .offset(y: -diameter / 2)
                    .rotationEffect(.degrees(Double(mark) * 60))
            }

            Button {
                onFocus(focus)
            } label: {
                VStack(spacing: 5) {
                    Image(systemName: layer.symbol)
                        .font(.system(size: isFocused ? 17 : 13, weight: .medium))
                    Text(layer.title.uppercased())
                        .font(.system(size: 7, weight: .bold, design: .monospaced))
                        .tracking(1)
                }
                .foregroundStyle(isFocused ? .white : .white.opacity(0.48))
                .frame(width: 62, height: 62)
                .background(.ultraThinMaterial.opacity(isFocused ? 0.7 : 0.35), in: Circle())
                .overlay(Circle().stroke(.white.opacity(isFocused ? 0.24 : 0.08), lineWidth: 1))
                .shadow(color: isFocused ? .cyan.opacity(0.25) : .clear, radius: 18)
            }
            .buttonStyle(.plain)
            .offset(y: -diameter / 2)
            .rotationEffect(.degrees(-astrolabe.rotation * (index.isMultiple(of: 2) ? 1 : -0.7)))
        }
    }

    private var starDust: some View {
        Canvas { context, canvasSize in
            let points = stride(from: 0, to: 64, by: 1).map { CGFloat($0) }
            for point in points {
                let x = (point * 47).truncatingRemainder(dividingBy: canvasSize.width)
                let y = (point * 83).truncatingRemainder(dividingBy: canvasSize.height)
                let radius: CGFloat = point.truncatingRemainder(dividingBy: 5) == 0 ? 1.4 : 0.7
                context.fill(Path(ellipseIn: CGRect(x: x, y: y, width: radius, height: radius)), with: .color(.white.opacity(0.24)))
            }
        }
        .frame(width: size * 1.02, height: size * 1.02)
        .allowsHitTesting(false)
    }
}

private struct AstrolabeArm: View {
    let rotation: Double

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 2)
                .fill(
                    LinearGradient(colors: [.white.opacity(0.05), .white.opacity(0.5), .white.opacity(0.05)], startPoint: .top, endPoint: .bottom)
                )
                .frame(width: 2, height: 190)
                .offset(y: -95)

            Circle()
                .fill(.black.opacity(0.6))
                .frame(width: 22, height: 22)
                .overlay(Circle().stroke(.white.opacity(0.5), lineWidth: 1))
                .shadow(color: .cyan.opacity(0.25), radius: 12)
        }
        .rotationEffect(.degrees(rotation))
        .allowsHitTesting(false)
    }
}

private struct NexusCore: View {
    let focus: NexusFocus
    let reduceMotion: Bool

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    RadialGradient(colors: [.white.opacity(0.2), .cyan.opacity(0.12), .purple.opacity(0.08), .clear], center: .center, startRadius: 2, endRadius: 92)
                )
                .frame(width: 190, height: 190)
                .blur(radius: 8)

            Circle()
                .fill(.ultraThinMaterial.opacity(0.8))
                .frame(width: 116, height: 116)
                .overlay(Circle().stroke(.white.opacity(0.24), lineWidth: 1))
                .shadow(color: .purple.opacity(0.25), radius: 30)

            Circle()
                .trim(from: 0.08, to: 0.82)
                .stroke(
                    AngularGradient(colors: [.cyan, .purple, .white.opacity(0.15), .cyan], center: .center),
                    style: StrokeStyle(lineWidth: 3, lineCap: .round)
                )
                .frame(width: 98, height: 98)
                .rotationEffect(.degrees(reduceMotion ? 30 : 210))

            VStack(spacing: 3) {
                Image(systemName: "circle.hexagongrid.fill")
                    .font(.system(size: 27, weight: .medium))
                    .foregroundStyle(.white)
                Text("NEXUS")
                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                    .tracking(2.5)
                    .foregroundStyle(.white.opacity(0.65))
                Text(focus == .nexus ? "ALIGNED" : focus.rawValue.uppercased())
                    .font(.system(size: 7, weight: .semibold, design: .monospaced))
                    .tracking(1.4)
                    .foregroundStyle(.cyan.opacity(0.8))
            }
        }
        .animation(reduceMotion ? nil : .spring(response: 0.55, dampingFraction: 0.78), value: focus)
    }
}

private struct ExecutionsView: View {
    var body: some View {
        NavigationStack {
            ContentUnavailableView("No executions", systemImage: "bolt", description: Text("Completed and active work will appear here."))
                .navigationTitle("Executions")
        }
    }
}

private struct CapabilitiesView: View {
    var body: some View {
        NavigationStack {
            ContentUnavailableView("No capabilities", systemImage: "square.stack.3d.up", description: Text("Available tools and providers will appear here."))
                .navigationTitle("Capabilities")
        }
    }
}

private struct EvidenceView: View {
    var body: some View {
        NavigationStack {
            ContentUnavailableView("No evidence", systemImage: "checkmark.seal", description: Text("Execution evidence will appear here after work completes."))
                .navigationTitle("Evidence")
        }
    }
}
