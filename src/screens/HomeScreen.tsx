import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import Modal from 'react-native-modal';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

function StatCard({ label, value, color, icon }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {icon}
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActivityCard({ title, desc }: any) {
  return (
    <View style={styles.activityCard}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activityDesc}>{desc}</Text>
    </View>
  );
}

function ActionButton({ label, color, icon }: any) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color }]}>
      {icon}
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState<string>('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');

  // Sincroniza profileImage con el perfil al abrir el menú
  const openMenu = () => {
    setProfileImage(profile?.avatar_url && profile?.avatar_url.trim() !== '' ? profile.avatar_url : null);
    setMenuVisible(true);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('name, role_id, roles:role_id(name), phone, location, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.log('SUPABASE ERROR:', error);
        Alert.alert('Error', 'No se pudo cargar el perfil');
        setLoading(false);
        return;
      }
      setProfile(data);
      setRole(Array.isArray(data?.roles) && data.roles.length > 0 ? data.roles[0].name : '');
      setProfileImage(data?.avatar_url || null);
      setEditPhone(data?.phone || '');
      setEditLocation(data?.location || '');
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // Guardar cambios de teléfono y ubicación
  const handleSaveProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ phone: editPhone, location: editLocation })
      .eq('id', user.id);
    setLoading(false);
    if (error) {
      Alert.alert('Error', 'No se pudo guardar');
    } else {
      setProfile({ ...profile, phone: editPhone, location: editLocation });
      setEditing(false);
      Alert.alert('Éxito', 'Datos actualizados');
    }
  };

  // Cerrar sesión y limpiar estados
  const logout = async () => {
    setProfile(null);
    setProfileImage(null);
    setMenuVisible(false);
    await supabase.auth.signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  // Cambiar foto de perfil
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.uri;
      setProfileImage(uri);

      // Subir imagen a Supabase Storage y guardar la URL en el perfil
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const filePath = `avatars/${user.id}_${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(asset.base64!), { contentType: 'image/jpeg', upsert: true });

      if (uploadError) {
        Alert.alert('Error', 'No se pudo subir la imagen');
        return;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = data.publicUrl;

      await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
      setProfileImage(avatarUrl);
      setProfile({ ...profile, avatar_url: avatarUrl });
    }
  };

  // Eliminar foto de perfil y limpiar estado
  const removeImage = async () => {
    setProfileImage(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
    setProfile({ ...profile, avatar_url: null });
  };

  // Utilidad para obtener solo primer nombre y apellido
  function getShortName(fullName: string = '') {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    if (parts.length > 1) return `${parts[0]} ${parts[1]}`;
    return '';
  }
  
  // Veterinario
  const vetStats = [
    { label: 'Citas Pendientes', value: 5, color: '#1CEA9B', icon: <Ionicons name="calendar" size={32} color="#fff" /> },
    { label: 'Mensajes Nuevos', value: 2, color: '#A259FF', icon: <Ionicons name="chatbubble-ellipses" size={32} color="#fff" /> },
  ];
  const vetActivities = [
    { id: '1', title: 'Consulta programada', desc: 'Luna - 10:00 AM, 2 Sep' },
    { id: '2', title: 'Vacuna aplicada', desc: 'Rocky - 1 Sep' },
  ];
  const vetActions = [
    { label: 'Ver Pacientes', color: '#E2ECED', icon: <FontAwesome5 name="dog" size={24} color="#013847" /> },
    { label: 'Agenda del Día', color: '#1CEA9B', icon: <Ionicons name="calendar-outline" size={24} color="#013847" /> },
    { label: 'Mensajes', color: '#A259FF', icon: <Ionicons name="chatbubbles-outline" size={24} color="#fff" /> },
    { label: 'Nueva Cita', color: '#46ECAC', icon: <MaterialCommunityIcons name="calendar-plus" size={24} color="#013847" /> },
  ];

  // Paciente
  const clientStats = [
    { label: 'Próxima Cita', value: '12 Sep', color: '#1CEA9B', icon: <Ionicons name="calendar" size={32} color="#fff" /> },
    { label: 'Mensajes', value: 1, color: '#A259FF', icon: <Ionicons name="chatbubble-ellipses" size={32} color="#fff" /> },
  ];
  const clientActivities = [
    { id: '1', title: 'Vacuna programada', desc: '10:00 AM, 12 Sep' },
    { id: '2', title: 'Consulta realizada', desc: '1 Sep' },
  ];
  const clientActions = [
    { label: 'Mis Mascotas', color: '#E2ECED', icon: <FontAwesome5 name="dog" size={24} color="#013847" /> },
    { label: 'Agendar Cita', color: '#1CEA9B', icon: <MaterialCommunityIcons name="calendar-plus" size={24} color="#013847" /> },
    { label: 'Mensajes', color: '#A259FF', icon: <Ionicons name="chatbubbles-outline" size={24} color="#fff" /> },
    { label: 'Historial', color: '#46ECAC', icon: <MaterialCommunityIcons name="history" size={24} color="#013847" /> },
  ];

  const isVet = role === 'veterinario';

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1CEA9B" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ padding: 23 }}>
        {/* Encabezado */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>
              {isVet
                ? `Hola, Dr. ${getShortName(profile?.name || '')}`
                : `Hola, ${getShortName(profile?.name || '')}`}
            </Text>
            <Text style={styles.role}>
              {isVet ? 'Veterinario Principal' : 'Cliente'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Ionicons name="notifications-outline" size={28} color="#013847" />
            <TouchableOpacity onPress={openMenu}>
              <Ionicons name="menu" size={28} color="#013847" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Estadísticas */}
        <View style={styles.statsRow}>
          {(isVet ? vetStats : clientStats).map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </View>

        {/* Actividad Reciente */}
        <Text style={styles.sectionTitle}>Actividad Reciente</Text>
        <View>
          {(isVet ? vetActivities : clientActivities).map((item) => (
            <ActivityCard key={item.id} {...item} />
          ))}
        </View>

        {/* Acciones rápidas */}
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.actionsGrid}>
          {(isVet ? vetActions : clientActions).map((item) => (
            <ActionButton key={item.label} {...item} />
          ))}
        </View>
      </ScrollView>

      {/* Menú lateral */}
      <Modal
        isVisible={menuVisible}
        animationIn="slideInRight"
        animationOut="slideOutRight"
        onBackdropPress={() => setMenuVisible(false)}
        style={styles.menuModal}
      >
        <View style={styles.menuContainer}>
          {/* Foto de perfil */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity onPress={pickImage}>
              <Image
                source={
                  profileImage && typeof profileImage === 'string' && profileImage.trim() !== ''
                    ? { uri: profileImage }
                    : require('../../assets/default-avatar.png')
                }
                style={styles.avatar}
              />
              <View style={styles.editIcon}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
            {profileImage && (
              <TouchableOpacity onPress={removeImage} style={{ marginTop: 4 }}>
                <Text style={{ color: '#A259FF', fontSize: 13 }}>Eliminar foto</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Info editable */}
          <Text style={styles.menuName}>{profile?.name || 'Sin nombre'}</Text>
          {editing ? (
            <>
              <TextInput
                style={styles.menuInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Teléfono"
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.menuInput}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="Ubicación"
              />
              <TouchableOpacity style={styles.menuBtn} onPress={handleSaveProfile}>
                <Ionicons name="save-outline" size={20} color="#013847" />
                <Text style={styles.menuBtnText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuBtn} onPress={() => setEditing(false)}>
                <Ionicons name="close-outline" size={20} color="#013847" />
                <Text style={styles.menuBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.menuInfo}>{profile?.phone || 'Sin teléfono'}</Text>
              <Text style={styles.menuInfo}>{profile?.location || 'Sin ubicación'}</Text>
              <TouchableOpacity style={styles.menuBtn} onPress={() => setEditing(true)}>
                <Ionicons name="create-outline" size={20} color="#013847" />
                <Text style={styles.menuBtnText}>Editar datos</Text>
              </TouchableOpacity>
            </>
          )}
          {/* Cambiar contraseña */}
          <TouchableOpacity style={styles.menuBtn} onPress={() => {
            setMenuVisible(false);
            navigation.navigate('ChangePassword');
          }}>
            <Ionicons name="key-outline" size={20} color="#013847" />
            <Text style={styles.menuBtnText}>Cambiar contraseña</Text>
          </TouchableOpacity>
          {/* Cerrar sesión */}
          <TouchableOpacity style={[styles.menuBtn, { backgroundColor: '#E2ECED' }]} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#013847" />
            <Text style={styles.menuBtnText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    marginBottom: 24,
    paddingTop: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hello: {
    fontSize: 22,
    fontWeight: '700',
    color: '#013847',
  },
  role: {
    fontSize: 16,
    color: '#6C6464',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
    minWidth: 120,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#013847',
    marginVertical: 16,
  },
  activityCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#E2ECED',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#013847',
  },
  activityDesc: {
    fontSize: 14,
    color: '#6C6464',
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionBtn: {
    width: '47%',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    gap: 10,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#013847',
  },
  logoutBtn: {
    marginTop: 24,
    alignSelf: 'center',
    backgroundColor: '#E2ECED',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logoutText: {
    color: '#013847',
    fontWeight: '700',
    fontSize: 16,
  },
  menuModal: {
    margin: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  menuContainer: {
    width: 285,
    backgroundColor: '#fff',
    height: '100%',
    paddingTop: 52,
    padding: 26,
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E2ECED',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#A259FF',
    borderRadius: 12,
    padding: 4,
  },
  menuName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#013847',
    textAlign: 'center',
    marginBottom: 4,
  },
  menuInfo: {
    fontSize: 15,
    color: '#6C6464',
    textAlign: 'center',
    marginBottom: 2,
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 18,
  },
  menuBtnText: {
    fontSize: 16,
    color: '#013847',
    fontWeight: '600',
  },
  menuInput: {
    borderWidth: 1,
    borderColor: '#E2ECED',
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    fontSize: 15,
    color: '#013847',
    backgroundColor: '#F7F7F7',
    textAlign: 'center',
  },
});
