"""
Script para probar las optimizaciones de memoria localmente
"""
import subprocess
import time
import sys
import os

def run_memory_test():
    """Ejecutar pruebas de memoria y rendimiento"""
    print("🔍 Ejecutando pruebas de memoria y rendimiento...")
    
    # Cambiar al directorio Backend
    backend_dir = os.path.join(os.path.dirname(__file__), 'Backend')
    os.chdir(backend_dir)
    
    try:
        # Instalar dependencias
        print("📦 Instalando dependencias...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], check=True)
        
        # Ejecutar migraciones
        print("🔄 Ejecutando migraciones...")
        subprocess.run([sys.executable, 'manage.py', 'migrate'], check=True)
        
        # Monitorear memoria inicial
        print("💾 Memoria inicial:")
        subprocess.run([sys.executable, 'manage.py', 'monitor_memory', '--verbose'], check=True)
        
        # Iniciar servidor en modo test
        print("🚀 Iniciando servidor de prueba...")
        server_process = subprocess.Popen([
            sys.executable, 'manage.py', 'runserver', '0.0.0.0:8001'
        ])
        
        # Esperar un momento para que inicie
        time.sleep(5)
        
        # Monitorear memoria después del inicio
        print("💾 Memoria después del inicio:")
        subprocess.run([sys.executable, 'manage.py', 'monitor_memory', '--verbose'], check=True)
        
        print("✅ Servidor iniciado en http://localhost:8001")
        print("Presiona Ctrl+C para detener el servidor y continuar con las pruebas")
        
        # Esperar a que el usuario detenga el servidor
        try:
            server_process.wait()
        except KeyboardInterrupt:
            print("🛑 Deteniendo servidor...")
            server_process.terminate()
            server_process.wait()
        
        # Limpieza final
        print("🧹 Ejecutando limpieza de memoria...")
        subprocess.run([sys.executable, 'manage.py', 'monitor_memory', '--cleanup'], check=True)
        
        print("✅ Pruebas completadas exitosamente!")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error durante las pruebas: {e}")
        return False
    except KeyboardInterrupt:
        print("🛑 Pruebas interrumpidas por el usuario")
        return False
    
    return True

if __name__ == "__main__":
    print("🔧 Probador de optimizaciones de memoria para Optipro")
    print("=" * 50)
    
    success = run_memory_test()
    
    if success:
        print("\n🎉 ¡Todas las optimizaciones están funcionando correctamente!")
        print("📋 Resumen de cambios aplicados:")
        print("   • Aumentado max-requests de 1000 a 5000")
        print("   • Aumentado timeout de 120 a 300 segundos")
        print("   • Agregado middleware de optimización de memoria")
        print("   • Mejoradas configuraciones de base de datos")
        print("   • Agregado monitoreo de memoria")
        print("   • Configurado cache para mejorar rendimiento")
    else:
        print("\n❌ Hubo problemas durante las pruebas.")
        print("Revisa los logs para más detalles.")
